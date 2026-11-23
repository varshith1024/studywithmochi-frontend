/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend =
      process.env.NODE_ENV === "production"
        ? "https://studywithmochi-backend-fixed.onrender.com"
        : "http://localhost:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;