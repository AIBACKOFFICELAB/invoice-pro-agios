import type { Metadata } from "next";
import "./globals.css";
import { StudioShell } from "@/components/navigation/studio-shell";

export const metadata: Metadata = {
  title: "Invoice Pro Agios — Smarter Invoicing for Modern Businesses",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  description: "Universal invoicing, smart estimates, deposit schedules, and automated accounts receivable platform built by AGIOS Venture Studio for modern businesses, freelancers, agencies, and operators.",
  openGraph: {
    title: "Invoice Pro Agios — Smarter Invoicing for Modern Businesses",
    description: "Create custom-branded estimates and invoices in seconds. Request deposits, attach files two ways, automate payment reminders, and get paid with 1-click Stripe checkout.",
    url: "https://invoicepro.agiosventure.com",
    siteName: "Invoice Pro Agios",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Invoice Pro Agios — An AGIOS Venture Studio Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/tailwind.css" />
      </head>
      <body className="antialiased min-h-screen">
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}
