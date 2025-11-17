import { pathToFileURL } from "url";
import { resolve as resolvePath } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const basePath = fileURLToPath(new URL(".", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  // Handle @/ paths
  if (specifier.startsWith("@/")) {
    const path = specifier.replace("@/", "");
    let resolvedPath = resolvePath(basePath, path);

    // Add .js extension if not present
    if (
      !resolvedPath.endsWith(".js") &&
      !resolvedPath.endsWith(".json") &&
      !resolvedPath.endsWith("/")
    ) {
      const withJs = resolvedPath + ".js";
      if (existsSync(withJs)) {
        resolvedPath = withJs;
      } else if (existsSync(resolvedPath)) {
        // Keep original if file exists without extension
      } else {
        resolvedPath = withJs;
      }
    }

    return {
      shortCircuit: true,
      url: pathToFileURL(resolvedPath).href,
    };
  }

  // Default resolution
  return nextResolve(specifier, context);
}
