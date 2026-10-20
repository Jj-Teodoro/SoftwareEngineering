import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
// student portal theme (CSS variables, .cp-* classes, light/dark), after Tailwind like before
import "./user/user.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
