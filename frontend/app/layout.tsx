import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/utils";
import StoreProvider from "@/store/StoreProvider";
import QueryProvider from "@/providers/QueryProvider";

const outfit = localFont({
  src: [
    { path: "../public/fonts/Outfit-Light.ttf", weight: "300" },
    { path: "../public/fonts/Outfit-Regular.ttf", weight: "400" },
    { path: "../public/fonts/Outfit-Medium.ttf", weight: "500" },
    { path: "../public/fonts/Outfit-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/Outfit-Bold.ttf", weight: "700" },
    { path: "../public/fonts/Outfit-ExtraBold.ttf", weight: "800" },
  ],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AccessPi",
  description: "Fingerprint access control device management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", outfit.variable)}>
      <body className="antialiased">
        <StoreProvider>
          <QueryProvider>{children}</QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
