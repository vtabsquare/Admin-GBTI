import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import AdminDashboard from "./AdminDashboard";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster richColors position="bottom-right" />
    <AdminDashboard />
  </StrictMode>
);
