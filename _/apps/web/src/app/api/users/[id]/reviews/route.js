import { supabase } from '../../../../../lib/supabase-server.js'

// GET /api/users/[id]/reviews - Get reviews for a user
export async function GET(request, { params }) {
    try {
        const { id: userId } = params
        const { searchParams } = new URL(request.url)
        const reviewType = searchParams.get("type") // 'worker' or 'employer'
        const limit = parseInt(searchParams.get("limit")) || 10
        const offset = parseInt(searchParams.get("offset")) || 0

        // Build query
        let query = supabase
            .from('user_reviews')
            .select(`
        id,
        rating,
        review_text,
        review_type,
        created_at,
        jobs!inner(
          id,
          title,
          category
        ),
        user_profiles!reviewer_id(
          full_name,
          profile_image
        )
      `)
            .eq('reviewee_id', userId)
            .order('created_at', { ascending: false })

        if (reviewType && ['worker', 'employer'].includes(reviewType)) {
            query = query.eq('review_type', reviewType)
        }

        if (limit > 0) {
            query = query.range(offset, offset + limit - 1)
        }

        const { data: reviews, error: reviewsError } = await query

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch reviews",
                },
                { status: 500 },
            )
        }

        // Get review counts and averages
        const { data: stats, error: statsError } = await supabase
            .from('user_rating_stats')
            .select('worker_rating, worker_review_count, employer_rating, employer_review_count')
            .eq('user_id', userId)
            .single()

        if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching rating stats:', statsError)
        }

        // Format reviews
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
            review_type: review.review_type,
            created_at: review.created_at,
            job: {
                id: review.jobs.id,
                title: review.jobs.title,
                category: review.jobs.category
            },
            reviewer: {
                full_name: review.user_profiles?.full_name,
                profile_image: review.user_profiles?.profile_image
            }
        }))

        return Response.json({
            success: true,
            reviews: formattedReviews,
            stats: {
                worker_rating: stats?.worker_rating || 0,
                worker_review_count: stats?.worker_review_count || 0,
                employer_rating: stats?.employer_rating || 0,
                employer_review_count: stats?.employer_review_count || 0
            },
            total: reviews.length
        })

    } catch (error) {
        console.error("Error fetching reviews:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch reviews",
            },
            { status: 500 },
        )
    }
}