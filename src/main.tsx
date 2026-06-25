import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import AppRoot from "./auth/AppRoot";
import "./index.css";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LelpzMtAAAAAAAfuUs-EM7dCRf0x1sOkuLzZgTi';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <Toaster richColors position="bottom-right" />
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </GoogleReCaptchaProvider>
  </StrictMode>
);
