/**
 * Load .env from backend directory before any other application code.
 * Must be imported first in index.ts so process.env is set before config runs.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
