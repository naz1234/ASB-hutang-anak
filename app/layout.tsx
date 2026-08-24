import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASB Anak Tracker",
  description: "Aplikasi mudah alih untuk menjejak hutang dan bayaran balik ASB anak.",
  manifest: "/manifest.webmanifest",
  applicationName: "ASB Anak Tracker",
  appleWebApp: { capable: true, title: "ASB Anak", statusBarStyle: "black-translucent" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: { title: "ASB Anak Tracker", description: "Rekod hutang. Semak bayaran. Tenang.", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "ASB Anak Tracker" }] },
  twitter: { card: "summary_large_image", title: "ASB Anak Tracker", description: "Rekod hutang. Semak bayaran. Tenang.", images: ["/og.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#163934", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body>{children}</body></html>;
}
