// Only load dotenv in local development
if (process.env.NETLIFY_DEV) {
    require('dotenv').config();
}


const { getStore } = require("@netlify/blobs");

async function readPatches() {
    // Use the environment variables from .env file
    const store = getStore({
        name: "patches",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_ACCESS_TOKEN
    });
    
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
        patches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(patches)
        };
    } catch (err) {
        console.error("Error:", err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch patches', detail: err.message })
        };
    }
};