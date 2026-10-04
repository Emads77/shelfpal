import { createBrowserRouter } from "react-router";
import Layout from "./Layout.jsx";
import RequireAuth from "./RequireAuth.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import CollectionPage from "../features/collection/CollectionPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <CollectionPage /> }],
      },
      { path: "*", element: <h1>Page not found</h1> },
    ],
  },
]);
