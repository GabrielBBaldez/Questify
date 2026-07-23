import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { BookOpen, Home, PlusCircle, BarChart3, HelpCircle, Sparkles, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import styles from './Header.module.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  const handleNavClick = () => setMenuOpen(false);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: react to navigation
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.logoArea}>
        <NavLink to="/" className={styles.logo}>
          <BookOpen size={24} className={styles.logoIcon} />
          <span>Questify</span>
        </NavLink>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="Navegação principal">
        <NavLink to="/" className={linkClass} end onClick={handleNavClick}>
          <Home size={18} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/create" className={linkClass} onClick={handleNavClick}>
          <PlusCircle size={18} />
          <span>Criar</span>
        </NavLink>
        <NavLink to="/history" className={linkClass} onClick={handleNavClick}>
          <BarChart3 size={18} />
          <span>Histórico</span>
        </NavLink>
        <NavLink to="/generate" className={linkClass} onClick={handleNavClick}>
          <Sparkles size={18} />
          <span>Gerar IA</span>
        </NavLink>
        <NavLink to="/help" className={linkClass} onClick={handleNavClick}>
          <HelpCircle size={18} />
          <span>Ajuda</span>
        </NavLink>
      </nav>

      <div className={styles.actions}>
        <ThemeToggle />
        <UserAvatar />
      </div>
    </header>
  );
}
