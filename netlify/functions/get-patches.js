const { getStore } = require("@netlify/blobs");

async function readPatches() {
    const store = getStore("patches");
    const raw = await store.get("all");
    return raw ? JSON.parse(raw) : [];
}

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers };
    }

    if (event.httpMethod !== "GET") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    try {
        const patches = await readPatches();

        // Sort by most recent first
        patches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(patches)
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch patches', detail: err.message })
        };
    }
};