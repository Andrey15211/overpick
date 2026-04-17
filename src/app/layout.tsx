import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Overpick - Контрпики Overwatch",
    template: "%s | Overpick"
  },
  description: "Контрпики, тир-листы и патч-ноты Overwatch 2 для Season 2: Summit. Обновлено под патч от 14 апреля 2026 года, включая Sierra и свежую мету.",
  keywords: ["overwatch", "контрпики", "мета", "герои", "патчи", "тир-лист", "sierra", "season 2 summit", "overwatch 2", "counters", "tier list"],
  authors: [{ name: "Overpick Team" }],
  creator: "Overpick",
  publisher: "Overpick",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://overpick-phi.vercel.app",
    siteName: "Overpick",
    title: "Overpick - Контрпики Overwatch",
    description: "Найди лучший контрпик для любого героя Overwatch 2. Актуальная мета Season 2: Summit.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Overpick - Контрпики Overwatch",
    description: "Найди лучший контрпик для любого героя Overwatch 2 на патче Season 2: Summit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050508",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <a href="#main-content" className="skip-link">
          Перейти к содержимому
        </a>
        <Header />
        <main id="main-content" role="main" className="mainContent">
          {children}
        </main>
      </body>
    </html>
  );
}
