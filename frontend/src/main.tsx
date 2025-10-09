/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
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

import "@fontsource/roboto/100.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/900.css";
import "@/components/inbox/inbox.css";
import "@/components/visual-editor/v3/styles/index.css";
import "@/i18n/config";
import "@/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
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
                              <App />
                            </SocketProvider>
                          </DialogsProvider>
                        </SettingsProvider>
                      </PermissionProvider>
                    </AuthProvider>
                  </BroadcastChannelProvider>
                </ApiClientProvider>
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </StyledEngineProvider>
          </ToastProvider>
        </ThemeProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
