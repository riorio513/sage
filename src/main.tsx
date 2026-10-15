import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { consumeSetupFragment } from "./lib/token";
import App from "./App";
import "./styles.css";

// Must run before anything else reads the token or touches the URL.
consumeSetupFragment();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
