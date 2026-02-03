import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Get base path for GitHub Pages
const basePath = import.meta.env.BASE_URL;

const root = createRoot(rootElement);
root.render(
  <Router base={basePath}>
    <App />
  </Router>
);
