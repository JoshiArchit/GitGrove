import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Mock Tauri APIs for development purposes
if (import.meta.env.DEV && !("__TAURI_INTERNALS__" in window)) {
  const { installTauriMocks } = await import("./mocks/tauriMocks");
  installTauriMocks();
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
