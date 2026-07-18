import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@shared/theme/tokens.css";
import "@shared/styles/index.css";
import AppContainer from "@app/AppContainer";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContainer />
  </StrictMode>
);
