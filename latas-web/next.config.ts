/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["localhost"],
  },

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
      ],
    },
  ],

  redirects: async () => [
    {
      source: "/",
      destination: "/login",
      permanent: false,
    },
  ],

  // Opcional: habilitar React Compiler si lo habilitaste en tsconfig
  experimental: {
    reactCompiler: true,
  },
};

module.exports = nextConfig;