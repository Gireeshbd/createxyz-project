import { supabase } from '../../../../../lib/supabase-server.js'

// GET /api/users/[id]/rating-stats - Get rating statistics for a user
export async function GET(request, { params }) {
    try {
        const { id: userId } = params

        // Get rating stats from cached table
        const { data: stats, error: statsError } = await supabase
            .from('user_rating_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching rating stats:', statsError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch rating statistics",
                },
                { status: 500 },
            )
        }

        // If no stats exist, create default stats
        if (!stats) {
            const { data: newStats, error: createError } = await supabase
                .from('user_rating_stats')
                .insert({
                    user_id: userId,
                    worker_rating: 0,
                    worker_review_count: 0,
                    employer_rating: 0,
                    employer_review_count: 0
                })
                .select('*')
                .single()

            if (createError) {
                console.error('Error creating rating stats:', createError)
                return Response.json(
                    {
                        success: false,
                        error: "Failed to create rating statistics",
                    },
                    { status: 500 },
                )
            }

            return Response.json({
                success: true,
                stats: {
                    user_id: newStats.user_id,
                    worker_rating: newStats.worker_rating,
                    worker_review_count: newStats.worker_review_count,
                    employer_rating: newStats.employer_rating,
                    employer_review_count: newStats.employer_review_count,
                    last_updated: newStats.last_updated
                }
            })
        }

        // Get recent reviews for additional context
        const { data: recentReviews, error: reviewsError } = await supabase
            .from('user_reviews')
            .select(`
        rating,
        review_type,
        created_at,
        jobs!inner(title)
      `)
            .eq('reviewee_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)

        if (reviewsError) {
            console.error('Error fetching recent reviews:', reviewsError)
        }

        // Calculate rating distribution
        const { data: ratingDistribution, error: distributionError } = await supabase
            .from('user_reviews')
            .select('rating, review_type')
            .eq('reviewee_id', userId)

        let workerRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let employerRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

        if (!distributionError && ratingDistribution) {
            ratingDistribution.forEach(review => {
                if (review.review_type === 'worker') {
                    workerRatingDistribution[review.rating]++
                } else if (review.review_type === 'employer') {
                    employerRatingDistribution[review.rating]++
                }
            })
        }

        return Response.json({
            success: true,
            stats: {
                user_id: stats.user_id,
                worker_rating: stats.worker_rating,
                worker_review_count: stats.worker_review_count,
                employer_rating: stats.employer_rating,
                employer_review_count: stats.employer_review_count,
                last_updated: stats.last_updated,
                worker_rating_distribution: workerRatingDistribution,
                employer_rating_distribution: employerRatingDistribution,
                recent_reviews: recentReviews?.map(review => ({
                    rating: review.rating,
                    review_type: review.review_type,
                    created_at: review.created_at,
                    job_title: review.jobs?.title
                })) || []
            }
        })

    } catch (error) {
        console.error("Error fetching rating statistics:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch rating statistics",
            },
            { status: 500 },
        )
    }
}