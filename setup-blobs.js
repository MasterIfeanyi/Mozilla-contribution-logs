// This uses environment variables - NEVER commit these to git!
const { getStore } = require("@netlify/blobs");

async function setup() {
    // You can find these in your Netlify site settings
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_ACCESS_TOKEN;
    
    if (!siteID || !token) {
        console.error("Please set NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN environment variables");
        process.exit(1);
    }
    
    const store = getStore({
        name: "patches",
        siteID,
        token
    });
    
    // Get current data first
    const existing = await store.get("all");
    if (existing) {
        console.log("Store already has data:", JSON.parse(existing));
        return;
    }
    
    await store.set("all", JSON.stringify([]));
    console.log("Store initialized with empty array");
}

setup().catch(console.error);