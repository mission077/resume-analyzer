import "./globals.css";
import { Mona_Sans } from "next/font/google";

// Set up custom fonts - Mona Sans
const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

// Set up Metadata for SEO and UX
export const metadata = {
  title: "Resume Analyzer",
  description: "AI-powered resume optimization and analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${monaSans.className} antialiased pattern`}>
        {children}
      </body>
    </html>
  );
}
