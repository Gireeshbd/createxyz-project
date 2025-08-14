// Simple test endpoint to verify API routing is working

export async function GET() {
    return Response.json({
        success: true,
        message: "Jobs API test endpoint is working",
        timestamp: new Date().toISOString()
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        return Response.json({
            success: true,
            message: "Jobs API POST test endpoint is working",
            receivedData: body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}