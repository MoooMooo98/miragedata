import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mirage Data — IT Consulting, Apps & digitale Lösungen",
  description:
    "Mirage Data ist Ihr Partner für IT-Consulting, App-Entwicklung, Webentwicklung und digitale Lösungen — durchdacht, hochwertig, zuverlässig.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-paper font-sans">
        {children}
      </body>
    </html>
  );
}
