const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
  try {
    const dataPath = path.join(__dirname, '../../db/data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const patches = JSON.parse(data);
    
    // Sort by most recent first
    patches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(patches)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch patches' })
    };
  }
};