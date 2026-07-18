export { default as MainScreen } from "./components/MainScreen";
export { default as SetorScreen } from "./components/SetorScreen";
export { default as ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
export { default as EstruturaPage } from "./components/estrutura/EstruturaPage";
export { default as LegacySetorRedirect } from "./components/estrutura/LegacySetorRedirect";
export { useMainSetores, useSetorData, useSetoresOrganizados, setoresKeys } from "./hooks/useSetores";
export {
  resolveCurrentSetorId,
  buildSetorUrl,
  buildParentUrl,
  buildEstruturaUrl,
  findAncestryInTree,
  findNodeInTree,
  buildBreadcrumbItems,
  getNodeChildren,
  isDivisaoTipo,
  getTipoLabel,
} from "./utils/setorNavigation";
