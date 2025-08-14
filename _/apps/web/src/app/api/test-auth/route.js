import { supabase } from '../../../lib/supabase-server.js'

export async function GET(request) {
    try {
        console.log('=== AUTH TEST DEBUG ===')

        // Log all headers
        const headers = {}
        request.headers.forEach((value, key) => {
            headers[key] = value
        })
        console.log('Request headers:', headers)

        // Try to get session info
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session:', session)
        console.log('Session error:', sessionError)

        return Response.json({
            success: true,
            debug: {
                headers: headers,
                session: session,
                sessionError: sessionError,
                hasAuthHeader: !!request.headers.get('authorization'),
                hasCookies: !!request.headers.get('cookie')
            }
        })
    } catch (error) {
        console.error('Test auth error:', error)
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        console.log('POST body:', body)

        return Response.json({
            success: true,
            message: "POST test successful",
            body: body
        })
    } catch (error) {
        console.error('POST test error:', error)
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}