// Vercel serverless function entry point.
// This file MUST be committed to git so Vercel detects it as a function.
// It loads the pre-built server bundle (dist/api.cjs) created by npm run build.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bundle = require("../dist/api.cjs");
export default bundle.default || bundle;
