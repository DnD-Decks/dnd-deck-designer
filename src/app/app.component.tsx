import type { ReactNode } from "react";
import { type BaseLocationHook, Link, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import styles from "./app.module.css";
import { AppRoutes } from "./app.routes";

type Props = { hook?: BaseLocationHook };

function NavLink({ to, match, children }: { to: string; match: RegExp; children: ReactNode }) {
  const [location] = useLocation();
  return (
    <Link
      href={to}
      className={styles.navLink}
      aria-current={match.test(location) ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function App({ hook = useHashLocation }: Props) {
  return (
    <Router hook={hook}>
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            D<span className={styles.amp}>&amp;</span>D Deck Designer
          </h1>
          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/" match={/^\/$/}>
              Your characters
            </NavLink>
            <NavLink to="/catalog" match={/^\/catalog/}>
              Card catalog
            </NavLink>
          </nav>
        </header>
        <AppRoutes />
      </div>
    </Router>
  );
}
