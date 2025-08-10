import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Scope",
  description: "Real-time intelligent surveillance with custom detection systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientBody>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={5000}
          />
        </ClientBody>
      </body>
    </html>
  );
}
