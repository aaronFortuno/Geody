import { cp, mkdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceDir = resolve(__dirname, "../src/data");
const targetDir = resolve(__dirname, "../dist/data");

await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, {
  recursive: true,
  filter: (path) => {
    const extension = extname(path);
    return extension === "" || extension === ".json";
  },
});

console.log(`Copied JSON data files: ${sourceDir} -> ${targetDir}`);
