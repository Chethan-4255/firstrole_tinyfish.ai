import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FirstRole — Find your way in",
  description: "Live job and internship discovery with evidence-backed matching, clear visa details, and a shortlist that stays fresh.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
