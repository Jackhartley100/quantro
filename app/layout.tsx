import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quantro",
  description: "Quantro - Track income, expenses, and profits with clarity",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 antialiased`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}

