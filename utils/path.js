import { fileURLToPath } from "url";
import path from "path";

// Get the root directory of the project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, "..");

/**
 * Resolve absolute path from project root
 * @param {string} relativePath - Path relative to project root
 * @returns {string} Absolute path
 */
export function resolvePath(relativePath) {
  return path.resolve(ROOT_DIR, relativePath);
}

/**
 * Get __dirname equivalent for ES modules
 * @param {string} importMetaUrl - import.meta.url from the calling file
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}
