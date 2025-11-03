import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Disable scroll globally
document.body.style.overflow = "hidden";

// Disable text selection globally
document.body.style.userSelect = "none";
document.body.style.webkitUserSelect = "none"; // for Safari
document.body.style.mozUserSelect = "none"; // for Firefox
document.body.style.msUserSelect = "none"; // for old IE

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
