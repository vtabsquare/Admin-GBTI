import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";
import AppRoot from "./auth/AppRoot";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster richColors position="bottom-right" />
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  </StrictMode>
);
