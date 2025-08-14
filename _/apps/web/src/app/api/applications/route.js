import { supabase, getUser } from '../../../lib/supabase-server.js'

// GET /api/applications - Get user's application history
export async function GET(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                {
                    success: false,
                    error: "Authentication required",
                },
                { status: 401 },
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status") // pending, accepted, rejected, withdrawn
        const limit = parseInt(searchParams.get("limit")) || 20
        const offset = parseInt(searchParams.get("offset")) || 0

        // Build query
        let query = supabase
            .from('job_applications')
            .select(`
        id,
        job_id,
        message,
        hourly_rate,
        availability,
        experience,
        status,
        applied_at,
        updated_at,
        jobs!inner(
          id,
          title,
          description,
          category,
          location,
          pay_type,
          pay_amount,
          pay_currency,
          status as job_status,
          created_at,
          user_profiles!inner(
            full_name,
            profile_image,
            employer_rating,
            employer_review_count
          )
        )
      `)
            .eq('user_id', user.id)
            .order('applied_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        if (limit > 0) {
            query = query.range(offset, offset + limit - 1)
        }

        const { data: applications, error: applicationsError } = await query

        if (applicationsError) {
            console.error('Error fetching applications:', applicationsError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch applications",
                },
                { status: 500 },
            )
        }

        // Format applications data
        const formattedApplications = applications.map(app => ({
            id: app.id,
            job_id: app.job_id,
            message: app.message,
            hourly_rate: app.hourly_rate,
            availability: app.availability,
            experience: app.experience,
            status: app.status,
            applied_at: app.applied_at,
            updated_at: app.updated_at,
            job: {
                id: app.jobs.id,
                title: app.jobs.title,
                description: app.jobs.description,
                category: app.jobs.category,
                location: app.jobs.location,
                pay_type: app.jobs.pay_type,
                pay_amount: app.jobs.pay_amount,
                pay_currency: app.jobs.pay_currency,
                status: app.jobs.job_status,
                created_at: app.jobs.created_at,
                pay: formatPay(app.jobs.pay_type, app.jobs.pay_amount),
                employer: {
                    full_name: app.jobs.user_profiles.full_name,
                    profile_image: app.jobs.user_profiles.profile_image,
                    employer_rating: app.jobs.user_profiles.employer_rating,
                    employer_review_count: app.jobs.user_profiles.employer_review_count
                }
            }
        }))

        return Response.json({
            success: true,
            applications: formattedApplications,
            total: applications.length
        })

    } catch (error) {
        console.error("Error fetching applications:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch applications",
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