import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

const map = {
  ConfirmDeleteModal: "@features/setores",
  Step1Form: "@features/funcionarios",
  Step2Form: "@features/funcionarios",
  Step3Form: "@features/funcionarios",
  FuncionariosList: "@features/funcionarios",
  ObservationHistoryButton: "@features/funcionarios",
  ObservationHistoryModal: "@features/funcionarios",
  FilterModal: "@features/funcionarios",
  RelatorioTypeModal: "@features/funcionarios",
  CoordEdit: "@features/funcionarios",
  UserEdit: "@features/funcionarios",
  OrganogramModal: "@features/organograma",
  SectorModal: "@features/organograma",
  IndicadorForm: "@features/referencias",
  IndicadorList: "@features/referencias",
};

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
  let next = src;
  for (const [name, mod] of Object.entries(map)) {
    const re = new RegExp(
      `import\\s+${name}\\s+from\\s+['"]${mod.replace("/", "\\/")}['"]`,
      "g"
    );
    next = next.replace(re, `import { ${name} } from '${mod}'`);
  }
  if (next !== src) {
    fs.writeFileSync(file, next);
    console.log("named", path.relative(root, file));
  }
}
