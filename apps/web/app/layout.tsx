import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-site",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hisab — Your workspace",
  description: "Manage your clients, team, and business records in Hisab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={siteFont.variable}>{children}</body>
    </html>
  );
}
