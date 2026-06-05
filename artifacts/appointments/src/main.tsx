import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (externalApiUrl) {
  setBaseUrl(externalApiUrl.replace(/\/+$/, ""));
}

createRoot(document.getElementById("root")!).render(<App />);
