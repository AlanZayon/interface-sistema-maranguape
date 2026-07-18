import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  let next = src
    .replace(/'@shared\/api\/([^'"]+)"/g, "'@shared/api/$1'")
    .replace(/"@shared\/api\/([^'"]+)'/g, "'@shared/api/$1'")
    .replace(/'@features\/([^'"]+)"/g, "'@features/$1'")
    .replace(/"@features\/([^'"]+)'/g, "'@features/$1'");
  if (next !== src) {
    fs.writeFileSync(file, next);
    console.log("fixed", path.relative(root, file));
  }
}
