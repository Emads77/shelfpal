import { NavLink, Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/">ShelfPal</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
