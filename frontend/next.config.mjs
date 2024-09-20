/** @type {import('next').NextConfig} */
import withTM from "next-transpile-modules";

const nextConfig = withTM(["hexabot-widget"])({
  async rewrites() {
    return [
      {
        source: "/config",
        destination: "/api/config",
      },
    ];
  },
  webpack(config, _options) {
    return config;
  },
  publicRuntimeConfig: {
    lang: {
      default: "en",
    },
  },
  output: "standalone",
});

export default nextConfig;
