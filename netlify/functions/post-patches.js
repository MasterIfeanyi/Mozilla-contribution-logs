const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../db/data.json");

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

}