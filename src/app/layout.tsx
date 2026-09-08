import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Familia Castro Trips",
  description:
    "Caderno de despesas das viagens da Família Castro: viagens, lançamentos, câmbios e divisão de custos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Familia Castro Trips",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/familia.jpg",
    icon: "/familia.jpg",
  },
};

export const viewport = {
  themeColor: "#0a3d2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0a3d2e] font-sans">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
