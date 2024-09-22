/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
import { ApiClientProvider } from "@/hooks/useApiClient";
import { AuthProvider } from "@/hooks/useAuth";
import { ConfigProvider } from "@/hooks/useConfig";
import { PermissionProvider } from "@/hooks/useHasPermission";
import { SettingsProvider } from "@/hooks/useSetting";
import { ToastProvider } from "@/hooks/useToast";
import { theme } from "@/layout/themes/theme";
import { SocketProvider } from "@/websocket/socket-hooks";
import "../components/inbox/inbox.css";
import "../i18n/config";
import "../styles/globals.css";
import "../styles/visual-editor.css";

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
                    <AuthProvider>
                      <PermissionProvider>
                        <SettingsProvider>
                          <SocketProvider>
                            {getLayout(<Component {...pageProps} />)}
                          </SocketProvider>
                        </SettingsProvider>
                      </PermissionProvider>
                    </AuthProvider>
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
