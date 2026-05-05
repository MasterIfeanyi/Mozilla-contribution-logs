const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../db/data.json");

function readPatches() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        return [];
    }
}

function writePatches(patches) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(patches, null, 2), "utf8");
}


// extracting login credentials from an HTTP request using the HTTP Basic Authentication scheme.
function authenticate(event) {
    // Get the Authorization header
    const authHeader = event.headers["authorization"] || "";
    // Check if it’s Basic Auth
    if (!authHeader.startsWith("Basic ")) return false;
    // Remove the "Basic " prefix - "Basic dXNlcjpwYXNz" is 6 characters long
    const encoded = authHeader.slice(6);
    // Converts the Base64 string back into plain text
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    // Split into username and password
    const [username, password] = decoded.split(":");

    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) return false;
    return username === validUser && password === validPass;
}

exports.handler = async (event) => {

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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

    // POST: create new patch
    if (event.httpMethod === "POST") {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
        }

        const { title, description, link } = body;
        if (!title?.trim() || !description?.trim() || !link?.trim()) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        // Basic URL validation
        try {
            new URL(link);
        } catch {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid URL" }) };
        }

        const patches = readPatches();
        const newPatch = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description.trim(),
            link: link.trim(),
            createdAt: new Date().toISOString(),
        };

        patches.push(newPatch);
        writePatches(patches);

        return { statusCode: 201, headers, body: JSON.stringify(newPatch) };
    }


    // DELETE: remove a patch by id
    if (event.httpMethod === "DELETE") {
        const id = event.queryStringParameters?.id;
        if (!id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
        }

        const patches = readPatches();
        const filtered = patches.filter((p) => p.id !== id);
        if (filtered.length === patches.length) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
        }

        writePatches(filtered);
        return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
    }

    // PATCH: edit a patch by id
    if (event.httpMethod === "PATCH") {
        const id = event.queryStringParameters?.id;
        if (!id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
        }

        const patches = readPatches();
        const idx = patches.findIndex((p) => p.id === id);
        if (idx === -1) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
        }

        const { title, description, link } = body;
        if (link) {
            try { new URL(link); } catch {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid URL" }) };
            }
        }

        patches[idx] = {
            ...patches[idx],
            ...(title && { title: title.trim() }),
            ...(description && { description: description.trim() }),
            ...(link && { link: link.trim() }),
        };

        writePatches(patches);
        return { statusCode: 200, headers, body: JSON.stringify(patches[idx]) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
}