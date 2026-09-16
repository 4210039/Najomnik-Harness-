import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Fail loudly rather than rendering nothing: a missing mount point means
  // index.html was edited or the script was moved, and silence would be
  // confusing to debug.
  throw new Error("Mount point #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);