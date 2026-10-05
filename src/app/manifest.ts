import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeOS",
    short_name: "LifeOS",
    description: "Système personnel privé de pilotage, mesure et revue.",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#123c33",
    lang: "fr",
  };
}
