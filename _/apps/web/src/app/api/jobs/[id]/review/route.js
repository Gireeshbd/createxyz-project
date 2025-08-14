import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// POST /api/jobs/[id]/review - Create a review for a completed job
export async function POST(request, { params }) {
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

        const { id: jobId } = params
        const body = await request.json()
        const { rating, review_text, review_type, reviewee_id } = body

        // Validate required fields
        if (!rating || !review_type || !reviewee_id) {
            return Response.json(
                {
                    success: false,
                    error: "Missing required fields: rating, review_type, reviewee_id",
                },
                { status: 400 },
            )
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return Response.json(
                {
                    success: false,
                    error: "Rating must be between 1 and 5",
                },
                { status: 400 },
            )
        }

        // Validate review type
        if (!['worker', 'employer'].includes(review_type)) {
            return Response.json(
                {
                    success: false,
                    error: "Review type must be 'worker' or 'employer'",
                },
                { status: 400 },
            )
        }

        // Check if job exists and is completed
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, user_id, assigned_to, status')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return Response.json(
                {
                    success: false,
                    error: "Job not found",
                },
                { status: 404 },
            )
        }

        if (job.status !== 'completed') {
            return Response.json(
                {
                    success: false,
                    error: "Reviews can only be created for completed jobs",
                },
                { status: 400 },
            )
        }

        // Validate user permissions
        const isEmployer = job.user_id === user.id
        const isWorker = job.assigned_to === user.id

        if (!isEmployer && !isWorker) {
            return Response.json(
                {
                    success: false,
                    error: "You can only review jobs you were involved in",
                },
                { status: 403 },
            )
        }

        // Validate review type matches user role
        if (review_type === 'worker' && !isEmployer) {
            return Response.json(
                {
                    success: false,
                    error: "Only employers can review workers",
                },
                { status: 403 },
            )
        }

        if (review_type === 'employer' && !isWorker) {
            return Response.json(
                {
                    success: false,
                    error: "Only workers can review employers",
                },
                { status: 403 },
            )
        }

        // Validate reviewee_id matches the role
        if (review_type === 'worker' && reviewee_id !== job.assigned_to) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid reviewee for worker review",
                },
                { status: 400 },
            )
        }

        if (review_type === 'employer' && reviewee_id !== job.user_id) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid reviewee for employer review",
                },
                { status: 400 },
            )
        }

        // Check if review already exists
        const { data: existingReview } = await supabase
            .from('user_reviews')
            .select('id')
            .eq('job_id', jobId)
            .eq('reviewer_id', user.id)
            .eq('reviewee_id', reviewee_id)
            .eq('review_type', review_type)
            .single()

        if (existingReview) {
            return Response.json(
                {
                    success: false,
                    error: "You have already reviewed this person for this job",
                },
                { status: 400 },
            )
        }

        // Create the review
        const { data: review, error: reviewError } = await supabase
            .from('user_reviews')
            .insert({
                job_id: jobId,
                reviewer_id: user.id,
                reviewee_id: reviewee_id,
                rating: rating,
                review_text: review_text || null,
                review_type: review_type
            })
            .select('id, rating, review_text, review_type, created_at')
            .single()

        if (reviewError) {
            console.error('Error creating review:', reviewError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to create review",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            review: review,
            message: "Review created successfully",
        })

    } catch (error) {
        console.error("Error creating review:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to create review",
            },
            { status: 500 },
        )
    }
}