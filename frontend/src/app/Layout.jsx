import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../state/useAuth.js";
import AccountMenu from "./AccountMenu.jsx";
import { navItems } from "./navItems.js";
import "./Layout.css";

export default function Layout() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <div
      className={`app-shell ${signedIn ? "app-shell--signed-in" : "app-shell--guest"}`}
    >
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      {signedIn && (
        <header className="app-chrome">
          <Link to="/" className="app-brand">
            ShelfPal
          </Link>

          <nav className="app-nav" aria-label="Main">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="app-nav__link">
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <AccountMenu />
        </header>
      )}

      {!signedIn && (
        <header className="guest-header">
          <Link to="/" className="app-brand">
            ShelfPal
          </Link>
          {status === "anonymous" && (
            <nav className="guest-nav" aria-label="Account">
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </nav>
          )}
        </header>
      )}

      <main id="main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
