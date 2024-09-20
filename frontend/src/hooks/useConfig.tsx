import { createContext, useContext, useEffect, useState } from "react";

const ConfigContext = createContext<IConfig | null>(null);

export interface IConfig {
  apiUrl: string;
  ssoEnabled: boolean;
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
