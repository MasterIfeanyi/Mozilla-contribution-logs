require('dotenv').config();
console.log('Site ID:', process.env.NETLIFY_SITE_ID);
console.log('Token exists:', process.env.NETLIFY_ACCESS_TOKEN ? 'Yes' : 'No');