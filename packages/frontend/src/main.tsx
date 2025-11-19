/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { SnackbarCloseButton } from "@/app-components/displays/Toast/CloseButton";
import { ApiClientProvider } from "@/contexts/apiClient.context";
import { AuthProvider } from "@/contexts/auth.context";
import BroadcastChannelProvider from "@/contexts/broadcast-channel.context";
import { ConfigProvider } from "@/contexts/config.context";
import { DialogsProvider } from "@/contexts/dialogs.context";
import { PermissionProvider } from "@/contexts/permission.context";
import { SettingsProvider } from "@/contexts/setting.context";
import { ToastProvider } from "@/hooks/useToast";
import { theme } from "@/layout/themes/theme";
import { SocketProvider } from "@/websocket/socket-hooks";

import "@/components/inbox/inbox.css";
import "@/components/visual-editor/v3/styles/index.css";
import "@/i18n/config";
import "@/styles/globals.css";
import "@fontsource/roboto/100.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import "eazychart-css";
import ErrorBoundary from "./errors/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60,
    },
  },
});
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider>
        <ThemeProvider theme={theme}>
          <ToastProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            action={(snackbarKey) => (
              <SnackbarCloseButton snackbarKey={snackbarKey} />
            )}
          >
            <StyledEngineProvider injectFirst>
              <QueryClientProvider client={queryClient}>
                <CssBaseline />
                <ApiClientProvider>
                  <BroadcastChannelProvider channelName="main-channel">
                    <AuthProvider>
                      <PermissionProvider>
                        <SettingsProvider>
                          <DialogsProvider>
                            <SocketProvider>
                              <ErrorBoundary>
                                <App />
                              </ErrorBoundary>
                            </SocketProvider>
                          </DialogsProvider>
                        </SettingsProvider>
                      </PermissionProvider>
                    </AuthProvider>
                  </BroadcastChannelProvider>
                </ApiClientProvider>
                <ReactQueryDevtools
                  initialIsOpen={false}
                  buttonPosition="bottom-left"
                />
              </QueryClientProvider>
            </StyledEngineProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
