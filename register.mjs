import { register } from "node:module";
import { pathToFileURL } from "url";
import { resolve as resolvePath } from "path";
import { fileURLToPath } from "url";

const basePath = fileURLToPath(new URL(".", import.meta.url));

register("./loader-hook.mjs", import.meta.url);
