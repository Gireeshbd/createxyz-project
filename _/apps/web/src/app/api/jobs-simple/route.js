import { supabase } from '../../../lib/supabase-server.js'

export async function POST(request) {
    try {
        console.log('=== SIMPLE JOB CREATION TEST ===')

        const body = await request.json()
        console.log('Request body:', body)

        const {
            title,
            description,
            category,
            location,
            duration,
            pay_type,
            pay_amount,
        } = body

        // Validate required fields
        if (!title || !description || !category || !location || !duration || !pay_type || !pay_amount) {
            return Response.json(
                {
                    success: false,
                    error: "Missing required fields",
                    received: { title, description, category, location, duration, pay_type, pay_amount }
                },
                { status: 400 }
            )
        }

        // Use a test user ID for now
        const testUserId = '00000000-0000-0000-0000-000000000000'

        const jobData = {
            title,
            description,
            category,
            location,
            duration,
            pay_type,
            pay_amount,
            urgent: false,
            poster_name: 'Test User',
            poster_email: 'test@example.com',
            poster_phone: null,
            requirements: null,
            required_skills: null,
            user_id: testUserId,
            status: 'active'
        }

        console.log('Inserting job data:', jobData)

        const { data: job, error } = await supabase
            .from('jobs')
            .insert(jobData)
            .select('id, title, created_at')
            .single()

        console.log('Insert result:', { job, error })

        if (error) {
            console.error('Database error:', error)
            return Response.json(
                {
                    success: false,
                    error: "Database error: " + error.message,
                    details: error
                },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            job,
            message: "Job created successfully (test mode)"
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return Response.json(
            {
                success: false,
                error: "Unexpected error: " + error.message,
                stack: error.stack
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    return Response.json({
        success: true,
        message: "Simple job API is working"
    })
}