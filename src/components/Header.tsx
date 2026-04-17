'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import '../styles/Header.css';

const NAV_LINKS = [
  { href: '/', label: 'Контрпики' },
  { href: '/meta', label: 'Мета' },
  { href: '/patches', label: 'Патчи' },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__container">
        <Link
          href="/"
          className="header__logo"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="header__logo-icon">◆</span>
          <span>Over</span>
          <span className="header__logo-accent">pick</span>
          <span className="header__logo-season">S2</span>
        </Link>

        <button
          type="button"
          className={`header__menu-btn ${isMenuOpen ? 'header__menu-btn--open' : ''}`}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav"
          aria-label="Открыть навигацию"
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="site-nav"
          className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}
        >
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
