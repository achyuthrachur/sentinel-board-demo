import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crowe Sentinel — AI Board Intelligence",
  description: "Real-time AI analysis engine for board-level financial decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
