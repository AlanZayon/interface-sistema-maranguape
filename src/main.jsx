import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@shared/theme/tokens.css";
import "@shared/styles/index.css";
import AppContainer from "@app/AppContainer";
import {
  applyPlatformBranding,
  resolveTenantSlugFromLocation,
} from "@shared/lib/tenant";

// Aplica título/favicon do console master antes do React montar
if (resolveTenantSlugFromLocation().isPlatform) {
  applyPlatformBranding();
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContainer />
  </StrictMode>
);
