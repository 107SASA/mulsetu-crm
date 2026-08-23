import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mulsetu CRM",
  description: "Client & project tracking for Mulsetu",
  icons: {
    icon: "/mulsetu-logo.jpg",
    shortcut: "/mulsetu-logo.jpg",
    apple: "/mulsetu-logo.jpg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/mulsetu-logo.jpg?v=4" type="image/jpeg" />
        <link rel="shortcut icon" href="/mulsetu-logo.jpg?v=4" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/mulsetu-logo.jpg?v=4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem("mulsetu-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full overflow-x-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
