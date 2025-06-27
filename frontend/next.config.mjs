/** @type {import('next').NextConfig} */
import withTM from "next-transpile-modules";

const nextConfig = withTM(["hexabot-chat-widget"])({
  async rewrites() {
    return [
      {
        source: "/config",
        destination: "/api/config",
      },
    ];
  },
  webpack(config) {
    if (process.env.NODE_ENV === "development") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },
  publicRuntimeConfig: {
    lang: {
      default: "en",
    },
  },
  output: "standalone",
  devIndicators: {
    position: "bottom-right",
  },
});

export default nextConfig;
