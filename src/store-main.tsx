import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CoritibaStore } from "./components/store/CoritibaStore";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoritibaStore />
  </StrictMode>
);
