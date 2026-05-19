import "./globals.css";
import { Providers } from "../lib/providers";

export const metadata = {
  title: "Anime Battle Arena",
  description: "On-chain anime character battles on Ritual Chain",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
