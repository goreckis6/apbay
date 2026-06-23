import type { NextConfig } from "next";

const UPLOADED_FILE_EXTENSIONS = [
  "txt", "js", "css", "json", "xml", "html", "htm", "svg", "webp",
  "png", "jpg", "jpeg", "gif", "ico", "woff", "woff2", "map", "md",
];

const uploadedFileRewrites = UPLOADED_FILE_EXTENSIONS.flatMap((ext) => [
  { source: `/:name([\\w.\\-+@=]+\\.${ext})`, destination: "/files/:name" },
  { source: `/:name([\\w.\\-+@=]+\\.${ext.toUpperCase()})`, destination: "/files/:name" },
]);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
    ],
  },
  async redirects() {
    return [{ source: "/files/:name", destination: "/:name", permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/sitemap.xml", destination: "/sitemaps/1" },
        { source: "/sitemap:number(\\d+).xml", destination: "/sitemaps/:number" },
        ...uploadedFileRewrites,
      ],
    };
  },
};

export default nextConfig;
