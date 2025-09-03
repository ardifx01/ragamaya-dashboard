import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/lib/provider/Provider";

export const metadata: Metadata = {
  title: "Dashboard Admin RagaMaya",
  description: "Admin RagaMaya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` antialiased dark`}
      >
        <Provider>
            {children}
        </Provider>
      </body>
    </html>
  );
}
