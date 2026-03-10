import Link from 'next/link';
import '../styles/Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <Link href="/" className="header__logo">
          <span className="header__logo-icon">◆</span>
          <span>Over</span>
          <span className="header__logo-accent">pick</span>
          <span className="header__logo-season">S1.5</span>
        </Link>
        
        <nav className="header__nav">
          <Link href="/" className="header__nav-link">
            Контрпики
          </Link>
          <Link href="/meta" className="header__nav-link">
            Мета
          </Link>
          <Link href="/patches" className="header__nav-link">
            Патчи
          </Link>
        </nav>
      </div>
    </header>
  );
}
