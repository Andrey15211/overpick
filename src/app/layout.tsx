import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Overpick - Контрпики Overwatch",
    template: "%s | Overpick"
  },
  description: "Лучший сервис для поиска контрпиков, изучения меты и патч-нотов Overwatch. Актуальные тир-листы Season 1.5 (март 2026). Подроли, балансные правки.",
  keywords: ["overwatch", "контрпики", "мета", "герои", "патчи", "тир-лист", "counters", "tier list", "season 1.5", "подроли", "subroles"],
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
    description: "Найди лучший контрпик для любого героя Overwatch. Актуальная мета Season 1.5.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Overpick - Контрпики Overwatch",
    description: "Найди лучший контрпик для любого героя Overwatch",
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
