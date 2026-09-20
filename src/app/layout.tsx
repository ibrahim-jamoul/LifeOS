import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LifeOS", template: "%s · LifeOS" },
  description: "Système personnel privé de pilotage, mesure et revue.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
