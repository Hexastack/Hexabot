/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { Roboto } from "next/font/google";
import Head from "next/head";
import { type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

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

import "../components/inbox/inbox.css";
import "../components/visual-editor/v3/styles/index.css";
import "../i18n/config";
import "../styles/globals.css";

type TNextPageWithLayout = NextPage & {
  // eslint-disable-next-line no-unused-vars
  getLayout?: (page: ReactElement) => ReactNode;
};

type TAppPropsWithLayout = AppProps & {
  Component: TNextPageWithLayout;
};

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

export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900", "500"],
});
const App = ({ Component, pageProps }: TAppPropsWithLayout) => {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>Hexabot</title>
        <link rel="icon" href="/images/favicon.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <main className={roboto.className}>
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
                                {getLayout(<Component {...pageProps} />)}
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
      </main>
    </>
  );
};

export default App;
