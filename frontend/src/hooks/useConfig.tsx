import { createContext, useContext, useEffect, useState } from "react";

const ConfigContext = createContext(null);

export interface IConfig {
  NEXT_PUBLIC_API_ORIGIN: string;
  NEXT_PUBLIC_SSO_ENABLED: boolean;
  REACT_APP_WIDGET_API_URL: string;
  REACT_APP_WIDGET_CHANNEL: string;
  REACT_APP_WIDGET_TOKEN: string;
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/config");
        const data = await res.json();

        setConfig(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch configuration:", error);
      }
    };

    fetchConfig();
  }, []);

  if (!config) {
    // You can return a loader here if you want
    return null;
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }

  return context;
};
