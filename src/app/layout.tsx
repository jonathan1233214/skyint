import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYINT — Military Aviation OSINT",
  description: "Community OSINT map platform for military aviation in the Israel/Middle East region",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-surface-1 text-text-primary">
        {children}
      </body>
    </html>
  );
}
