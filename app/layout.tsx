import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bluff Poker Probability",
  description: "Probability that a claimed poker hand exists on the board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
