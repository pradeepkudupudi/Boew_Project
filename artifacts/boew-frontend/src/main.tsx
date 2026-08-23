import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initThemeAndFont } from "@/lib/theme-config";

// Initialize customized theme and font preferences
initThemeAndFont();

createRoot(document.getElementById("root")!).render(<App />);
