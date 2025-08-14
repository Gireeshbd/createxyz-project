// Backup of the current jobs route
import { supabase, getUser } from '@/lib/supabase-server'

// GET /api/jobs - List jobs with filtering and search
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const urgent = searchParams.get("urgent");
        const status = searchParams.get("status") || "active";
        const location = searchParams.get("location");
        const maxDistance = searchParams.get("maxDistance");
        const userLat = searchParams.get("lat");
        const userLng = searchParams.get("lng");
        const limit = parseInt(searchParams.get("limit")) || 20;
        const offset = parseInt(searchParams.get("offset")) || 0;

        // Build Supabase query with application counts
        let query = supabase
            .from('jobs')
            .select(`
        id, title, description, category, location, latitude, longitude,
        duration, pay_type, pay_amount, pay_currency, urgent, 
        poster_name, poster_rating, poster_avatar, created_at, requirements,
        user_id, status, assigned_to,
        job_applications(count)
      `)
            .eq('status', status)
            .order('urgent', { ascending: false })
            .order('created_at', { ascending: false })

        if (category && category !== "all") {
            query = query.eq('category', category)
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
        }

        if (urgent === "true") {
            query = query.eq('urgent', true)
        }

        if (location) {
            query = query.ilike('location', `%${location}%`)
        }

        if (limit > 0) {
            query = query.range(offset, offset + limit - 1)
        }

        const { data: jobs, error } = await query

        if (error) {
            console.error("Error fetching jobs:", error);
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch jobs",
                },
                { status: 500 },
            );
        }

        // Calculate distance if coordinates provided
        const jobsWithDistance = jobs.map((job) => {
            let distance = null
            if (job.latitude && job.longitude && userLat && userLng) {
                // Simple distance calculation (Haversine formula approximation)
                const lat1 = parseFloat(userLat)
                const lng1 = parseFloat(userLng)
                const lat2 = parseFloat(job.latitude)
                const lng2 = parseFloat(job.longitude)

                const R = 3959 // Earth's radius in miles
                const dLat = (lat2 - lat1) * Math.PI / 180
                const dLng = (lng2 - lng1) * Math.PI / 180
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                distance = R * c
            }

            return {
                ...job,
                pay: formatPay(job.pay_type, job.pay_amount),
                postedTime: getRelativeTime(job.created_at),
                distance: distance ? `${distance.toFixed(1)} miles` : null,
                application_count: job.job_applications?.[0]?.count || 0,
                is_assigned: !!job.assigned_to
            }
        })

        // Filter by distance if specified
        const filteredJobs = maxDistance && userLat && userLng
            ? jobsWithDistance.filter(job => !job.distance || parseFloat(job.distance) <= parseFloat(maxDistance))
            : jobsWithDistance

        return Response.json({
            success: true,
            jobs: filteredJobs,
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return Response.json(
            {
                success: false,
                error: "Failed to fetch jobs",
            },
            { status: 500 },
        );
    }
}

// POST /api/jobs - Create a new job (requires authentication)
export async function POST(request) {
    try {
        console.log('=== JOB CREATION DEBUG ===')

        const user = await getUser(request)
        console.log('User from getUser:', user)

        if (!user) {
            return Response.json(
                {
                    success: false,
                    error: "Authentication required",
                },
                { status: 401 },
            );
        }

        const body = await request.json();
        const {
            title,
            description,
            category,
            location,
            duration,
            pay_type,
            pay_amount,
            urgent,
            poster_phone,
            requirements,
            required_skills,
        } = body;

        // Validate required fields
        if (
            !title ||
            !description ||
            !category ||
            !location ||
            !duration ||
            !pay_type ||
            !pay_amount
        ) {
            return Response.json(
                {
                    success: false,
                    error: "Missing required fields",
                },
                { status: 400 },
            );
        }

        // Get user profile for poster info
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single()

        console.log('Profile data:', profile)
        console.log('Profile error:', profileError)

        const jobData = {
            title,
            description,
            category,
            location,
            duration,
            pay_type,
            pay_amount,
            urgent: urgent || false,
            poster_name: profile?.full_name || user.email,
            poster_email: user.email,
            poster_phone: poster_phone || null,
            requirements: requirements || null,
            required_skills: required_skills || null,
            user_id: user.id,
            status: 'active'
        }

        console.log('Job data to insert:', jobData)

        const { data: job, error } = await supabase
            .from('jobs')
            .insert(jobData)
            .select('id, title, created_at')
            .single()

        console.log('Insert result:', { job, error })

        if (error) {
            console.error("Error creating job:", error);
            return Response.json(
                {
                    success: false,
                    error: "Failed to create job",
                },
                { status: 500 },
            );
        }

        return Response.json({
            success: true,
            job,
            message: "Job posted successfully",
        });
    } catch (error) {
        console.error("Error creating job:", error);
        return Response.json(
            {
                success: false,
                error: "Failed to create job",
            },
            { status: 500 },
        );
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

function getRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
        return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return time.toLocaleDateString();
}