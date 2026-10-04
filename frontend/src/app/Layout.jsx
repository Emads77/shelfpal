import { NavLink, Outlet } from "react-router";
import { useAuth } from "../state/useAuth.js";

export default function Layout() {
  const { user, status, logout } = useAuth();

  return (
    <>
      <header>
        <nav>
          <NavLink to="/">ShelfPal</NavLink>
          {status === "authenticated" && (
            <>
              <span>{user.username}</span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          )}
          {status === "anonymous" && (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
