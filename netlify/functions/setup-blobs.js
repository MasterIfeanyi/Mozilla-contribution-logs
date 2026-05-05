const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const store = getStore("patches");
        
        // Initialize with your sample data or empty array
        const samplePatches = [
            {
                "id": "1747000000000",
                "title": "Fix tab crash on memory pressure",
                "description": "Patched an issue where Firefox tabs would crash under heavy memory pressure due to improper garbage collection triggers in the tab unloading mechanism.",
                "link": "https://phabricator.services.mozilla.com/D123456",
                "createdAt": "2024-12-15T10:30:00Z"
            },
            {
                "id": "1746000000000",
                "title": "Fix memory leak in WebRTC ICE candidate handler",
                "description": "Resolved a long-standing memory leak triggered when ICE candidates were gathered but the peer connection was closed before negotiation completed. Affected long-running conference sessions.",
                "link": "https://phabricator.services.mozilla.com/D12345",
                "createdAt": "2025-04-20T10:30:00.000Z"
            }
        ];
        
        await store.set("all", JSON.stringify(samplePatches));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Store initialized successfully!" })
        };
    } catch (error) {
        console.error("Setup error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};