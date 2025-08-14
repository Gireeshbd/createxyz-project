import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// GET /api/users/[id]/dashboard - Get user dashboard data
export async function GET(request, { params }) {
    try {
        const currentUser = await getUser(request)
        const { id: userId } = params

        // Check if user is requesting their own dashboard or if it's public data
        const isOwnDashboard = currentUser && currentUser.id === userId

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (profileError || !profile) {
            return Response.json(
                {
                    success: false,
                    error: "User not found",
                },
                { status: 404 },
            )
        }

        // Get job statistics
        const { data: jobStats, error: jobStatsError } = await supabase
            .from('jobs')
            .select('status')
            .eq('user_id', userId)

        const jobStatistics = {
            total_posted: jobStats?.length || 0,
            active: jobStats?.filter(j => j.status === 'active').length || 0,
            assigned: jobStats?.filter(j => j.status === 'assigned').length || 0,
            completed: jobStats?.filter(j => j.status === 'completed').length || 0,
            cancelled: jobStats?.filter(j => j.status === 'cancelled').length || 0
        }

        // Get application statistics (as a worker)
        const { data: applicationStats, error: appStatsError } = await supabase
            .from('job_applications')
            .select('status')
            .eq('user_id', userId)

        const applicationStatistics = {
            total_applied: applicationStats?.length || 0,
            pending: applicationStats?.filter(a => a.status === 'pending').length || 0,
            accepted: applicationStats?.filter(a => a.status === 'accepted').length || 0,
            rejected: applicationStats?.filter(a => a.status === 'rejected').length || 0,
            withdrawn: applicationStats?.filter(a => a.status === 'withdrawn').length || 0
        }

        // Get rating statistics
        const { data: ratingStats, error: ratingStatsError } = await supabase
            .from('user_rating_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        // Get recent activity (jobs and applications)
        let recentJobs = []
        let recentApplications = []

        if (isOwnDashboard) {
            // Get recent jobs posted by user
            const { data: jobs } = await supabase
                .from('jobs')
                .select(`
          id, title, status, created_at, updated_at,
          job_applications(count)
        `)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(5)

            recentJobs = jobs?.map(job => ({
                ...job,
                application_count: job.job_applications?.[0]?.count || 0
            })) || []

            // Get recent applications by user
            const { data: applications } = await supabase
                .from('job_applications')
                .select(`
          id, status, applied_at, updated_at,
          jobs!inner(
            id, title, category, pay_type, pay_amount,
            user_profiles!inner(full_name)
          )
        `)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(5)

            recentApplications = applications?.map(app => ({
                id: app.id,
                status: app.status,
                applied_at: app.applied_at,
                updated_at: app.updated_at,
                job: {
                    id: app.jobs.id,
                    title: app.jobs.title,
                    category: app.jobs.category,
                    pay: formatPay(app.jobs.pay_type, app.jobs.pay_amount),
                    employer_name: app.jobs.user_profiles.full_name
                }
            })) || []
        }

        // Get recent reviews (public)
        const { data: recentReviews } = await supabase
            .from('user_reviews')
            .select(`
        id, rating, review_text, review_type, created_at,
        jobs!inner(title),
        user_profiles!reviewer_id(full_name, profile_image)
      `)
            .eq('reviewee_id', userId)
            .order('created_at', { ascending: false })
            .limit(3)

        const formattedReviews = recentReviews?.map(review => ({
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
            review_type: review.review_type,
            created_at: review.created_at,
            job_title: review.jobs.title,
            reviewer: {
                full_name: review.user_profiles?.full_name,
                profile_image: review.user_profiles?.profile_image
            }
        })) || []

        // Calculate completion rate
        const completionRate = jobStatistics.total_posted > 0
            ? (jobStatistics.completed / jobStatistics.total_posted * 100).toFixed(1)
            : 0

        const responseData = {
            success: true,
            profile: {
                user_id: profile.user_id,
                full_name: profile.full_name,
                bio: profile.bio,
                profile_image: profile.profile_image,
                location: profile.location,
                skills: profile.skills,
                created_at: profile.created_at
            },
            statistics: {
                jobs: jobStatistics,
                applications: isOwnDashboard ? applicationStatistics : null,
                ratings: {
                    worker_rating: ratingStats?.worker_rating || 0,
                    worker_review_count: ratingStats?.worker_review_count || 0,
                    employer_rating: ratingStats?.employer_rating || 0,
                    employer_review_count: ratingStats?.employer_review_count || 0
                },
                completion_rate: parseFloat(completionRate)
            },
            recent_activity: {
                jobs: isOwnDashboard ? recentJobs : [],
                applications: isOwnDashboard ? recentApplications : [],
                reviews: formattedReviews
            }
        }

        return Response.json(responseData)

    } catch (error) {
        console.error("Error fetching dashboard data:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch dashboard data",
            },
            { status: 500 },
        )
    }
}

function formatPay(payType, payAmount) {
    switch (payType) {
        case 'hourly':
            return `$${payAmount}/hour`
        case 'fixed':
            return `$${payAmount}`
        default:
            return `$${payAmount}/${payType.replace('per_', '')}`
    }
}