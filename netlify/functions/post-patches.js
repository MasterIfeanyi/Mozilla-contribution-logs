// Only load dotenv in local development
if (process.env.NETLIFY_DEV) {
    require('dotenv').config();
}

const { getStore } = require("@netlify/blobs");

function getStoreInstance() {
    return getStore({
        name: "patches",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_ACCESS_TOKEN
    });
}

async function readPatches() {
    const store = getStoreInstance();
    const raw = await store.get("all");
    return raw ? JSON.parse(raw) : [];
}

async function writePatches(patches) {
    const store = getStoreInstance();
    await store.set("all", JSON.stringify(patches));
}

function authenticate(event) {
    const authHeader = event.headers["authorization"] || "";
    if (!authHeader.startsWith("Basic ")) return false;
    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const [username, password] = decoded.split(":");

    return username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD;
}

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, DELETE, PATCH, OPTIONS",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers };
    }

    if (!authenticate(event)) {
        return {
            statusCode: 401,
            headers: { ...headers, "WWW-Authenticate": 'Basic realm="Admin"' },
            body: JSON.stringify({ error: "Unauthorized" }),
        };
    }

    try {

        // POST handler
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body);
            const { title, description, link } = body;

            if (!title?.trim() || !description?.trim() || !link?.trim()) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "Missing required fields" })
                };
            }

            try {
                new URL(link);
            } catch {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "Invalid URL" })
                };
            }

            const patches = await readPatches();
            const newPatch = {
                id: Date.now().toString(),
                title: title.trim(),
                description: description.trim(),
                link: link.trim(),
                createdAt: new Date().toISOString(),
            };

            patches.push(newPatch);
            await writePatches(patches);

            return { statusCode: 201, headers, body: JSON.stringify(newPatch) };
        }

        // DELETE handler

        if (event.httpMethod === "DELETE") {
            const id = event.queryStringParameters?.id;
            if (!id || id === "__probe__") {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
            }

            const patches = await readPatches();
            const filtered = patches.filter(p => p.id !== id);

            if (filtered.length === patches.length) {
                return { statusCode: 404, headers, body: JSON.stringify({ error: "Patch not found" }) };
            }

            await writePatches(filtered);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        // PATCH handler
        if (event.httpMethod === "PATCH") {
            const id = event.queryStringParameters?.id;
            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
            }

            const { title, description, link } = JSON.parse(event.body);
            if (!title?.trim() || !description?.trim() || !link?.trim()) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
            }

            try { new URL(link); } catch {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid URL" }) };
            }

            const patches = await readPatches();
            const index = patches.findIndex(p => p.id === id);

            if (index === -1) {
                return { statusCode: 404, headers, body: JSON.stringify({ error: "Patch not found" }) };
            }

            patches[index] = { ...patches[index], title: title.trim(), description: description.trim(), link: link.trim() };
            await writePatches(patches);
            return { statusCode: 200, headers, body: JSON.stringify(patches[index]) };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "Method not allowed" })
        };
    } catch (err) {
        console.error("Error:", err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Operation failed', detail: err.message })
        };
    }
};