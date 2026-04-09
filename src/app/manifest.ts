import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroBee",
    short_name: "NeuroBee",
    description: "A gentle space for supportive growth and daily insights.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5fbf8",
    theme_color: "#0f6b50",
    orientation: "portrait",
    categories: ["health", "lifestyle", "education"],
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Start Observation",
        url: "/milestones",
        description: "Begin a new milestone observation session",
      },
      {
        name: "View Insights",
        url: "/insights",
        description: "View developmental insights",
      },
    ],
  };
}
