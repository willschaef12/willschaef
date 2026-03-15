import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneRoot = join(".next", "standalone");
const standaloneNextRoot = join(standaloneRoot, ".next");
const staticSource = join(".next", "static");
const staticTarget = join(standaloneNextRoot, "static");
const publicSource = "public";
const publicTarget = join(standaloneRoot, "public");

if (!existsSync(standaloneRoot)) {
  process.exit(0);
}

mkdirSync(standaloneNextRoot, { recursive: true });

if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true });
}

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true });
}
