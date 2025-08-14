// Simple test route that doesn't depend on any external dependencies

export async function GET(request) {
    return Response.json({
        success: true,
        message: "Simple test route working",
        timestamp: new Date().toISOString()
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        return Response.json({
            success: true,
            message: "POST request received",
            data: body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: "Invalid JSON",
            timestamp: new Date().toISOString()
        }, { status: 400 });
    }
}