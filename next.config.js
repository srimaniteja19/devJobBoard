/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/unpdf\/dist\/pdfjs\.mjs/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

module.exports = nextConfig;
