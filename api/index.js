// Vercel serverless entry point (ESM - required because package.json has "type": "module")
// Loads the pre-built Express app bundle created by npm run build
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bundle = require("../dist/api.cjs");

export default bundle.default || bundle;
