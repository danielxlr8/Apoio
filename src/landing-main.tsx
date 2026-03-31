import React from "react";
import ReactDOM from "react-dom/client";
import { RouteflowLanding } from "./components/landing/RouteflowLanding";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouteflowLanding />
  </React.StrictMode>
);
