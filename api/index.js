// Vercel serverless entry point
// Loads the pre-built Express app bundle (built by npm run build)
const app = require("../dist/api.cjs");
module.exports = app.default || app;
