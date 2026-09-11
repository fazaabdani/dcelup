import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCelup Chicken Crispy",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f04b23",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <main id="app">{children}</main>
      </body>
    </html>
  );
}
