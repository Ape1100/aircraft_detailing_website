import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import { SettingsProvider } from "@/lib/settings-store";
import { AuthProvider } from "@/lib/auth-provider";
import "./index.css";

const posthogOptions = {
  api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
  person_profiles: "identified_only" as const,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={posthogOptions}
    >
      <HelmetProvider>
        <SettingsProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </SettingsProvider>
      </HelmetProvider>
    </PostHogProvider>
  </React.StrictMode>
);
