import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../src");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

const replacements = [
  [/from ['"]\.\.\/\.\.\/api\//g, "from '@shared/api/"],
  [/from ['"]\.\.\/api\//g, "from '@shared/api/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/api\//g, "from '@shared/api/"],
  [/from ['"]\.\.\/utils\/apiConfig['"]/g, "from '@shared/lib/apiConfig'"],
  [/from ['"]\.\.\/\.\.\/utils\/apiConfig['"]/g, "from '@shared/lib/apiConfig'"],
  [/from ['"]\.\/AuthContext['"]/g, "from '@features/auth'"],
  [/from ['"]\.\.\/AuthContext['"]/g, "from '@features/auth'"],
  [/from ['"]\.\.\/components\/AuthContext['"]/g, "from '@features/auth'"],
  [/from ['"]\.\/ProtectedRoutes['"]/g, "from '@features/auth'"],
  [/from ['"]\.\.\/components\/ProtectedRoutes['"]/g, "from '@features/auth'"],
  [/from ['"]\.\.\/context\/TenantContext['"]/g, "from '@shared/context/TenantContext'"],
  [/from ['"]\.\.\/\.\.\/context\/TenantContext['"]/g, "from '@shared/context/TenantContext'"],
  [/from ['"]\.\.\/hooks\/useSetores['"]/g, "from '@features/setores'"],
  [/from ['"]\.\.\/\.\.\/hooks\/useSetores['"]/g, "from '@features/setores'"],
  [/from ['"]\.\.\/hooks\/useDashboard['"]/g, "from '@features/dashboard'"],
  [/from ['"]\.\.\/\.\.\/hooks\/useDashboard['"]/g, "from '@features/dashboard'"],
  [/from ['"]\.\/ConfirmDeleteModal['"]/g, "from '@features/setores'"],
  [/from ['"]\.\/Step1Form['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/Step2Form['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/Step3Form['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/FuncionariosList['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/ObservationHistoryButton['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/ObservationHistoryModal['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/userEdit['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/UserEdit['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/CoordEdit['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/FilterModal['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/RelatorioTypeModal['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/OrganogramModal['"]/g, "from '@features/organograma'"],
  [/from ['"]\.\/SectorModal['"]/g, "from '@features/organograma'"],
  [/from ['"]\.\/IndicadorForm['"]/g, "from '@features/referencias'"],
  [/from ['"]\.\/IndicadorList['"]/g, "from '@features/referencias'"],
  [/from ['"]\.\/Header['"]/g, "from '@shared/layout/Header'"],
  [/from ['"]\.\.\/pages\/MainScreen['"]/g, "from '@features/setores'"],
  [/from ['"]\.\.\/pages\/SetorScreen['"]/g, "from '@features/setores'"],
  [/from ['"]\.\.\/pages\/Login['"]/g, "from '@features/auth'"],
  [/from ['"]\.\.\/pages\/Indicadores['"]/g, "from '@features/referencias'"],
  [/from ['"]\.\.\/pages\/Dashboard['"]/g, "from '@features/dashboard'"],
  [/from ['"]\.\.\/pages\/Users['"]/g, "from '@features/users'"],
  [/from ['"]\.\/components\/Header['"]/g, "from '@shared/layout/Header'"],
  [/from ['"]\.\/components\/FuncionariosList['"]/g, "from '@features/funcionarios'"],
  [/from ['"]\.\/components\/ProtectedRoutes['"]/g, "from '@features/auth'"],
  [/from ['"]\.\/components\/SectorModal['"]/g, "from '@features/organograma'"],
  [/from ['"]\.\/components\/AuthContext['"]/g, "from '@features/auth'"],
  [/from ['"]\.\/context\/TenantContext['"]/g, "from '@shared/context/TenantContext'"],
  [/from ['"]\.\/App['"]/g, "from '@app/App'"],
  [/from ['"]\.\/AppContainer['"]/g, "from '@app/AppContainer'"],
  [/from ['"]\.\/theme\/tokens\.css['"]/g, "from '@shared/theme/tokens.css'"],
  [/from ['"]\.\/index\.css['"]/g, "from '@shared/styles/index.css'"],
  [/from ['"]\.\/App\.css['"]/g, "from '@shared/styles/App.css'"],
];

let changed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  let next = src;
  for (const [re, to] of replacements) next = next.replace(re, to);
  next = next.replace(
    /\* as (\w+) from ['"]\.\.\/api\/([^'"]+)['"]/g,
    "* as $1 from '@shared/api/$2'"
  );
  next = next.replace(
    /\* as (\w+) from ['"]\.\.\/\.\.\/api\/([^'"]+)['"]/g,
    "* as $1 from '@shared/api/$2'"
  );
  next = next.replace(
    /from ['"]\.\.\/api\/([^'"]+)['"]/g,
    "from '@shared/api/$1'"
  );
  next = next.replace(
    /from ['"]\.\.\/\.\.\/api\/([^'"]+)['"]/g,
    "from '@shared/api/$1'"
  );
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    console.log("updated", path.relative(root, file));
  }
}
console.log("files changed", changed);
