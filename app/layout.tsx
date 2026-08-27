import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASB Kids Tracker",
  description: "A mobile app for tracking children's ASB debts and repayments.",
  manifest: "/manifest.webmanifest",
  applicationName: "ASB Kids Tracker",
  appleWebApp: { capable: true, title: "ASB Kids", statusBarStyle: "black-translucent" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: { title: "ASB Kids Tracker", description: "Track debts. Check payments. Peace of mind.", type: "website", images: [{ url: "/og-en.png", width: 1200, height: 630, alt: "ASB Kids Tracker" }] },
  twitter: { card: "summary_large_image", title: "ASB Kids Tracker", description: "Track debts. Check payments. Peace of mind.", images: ["/og-en.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#163934", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
