import { createBrowserRouter } from "react-router";
import Layout from "./Layout.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <h1>ShelfPal: Library Management App</h1> },
      { path: "register", element: <RegisterPage /> },
      { path: "*", element: <h1>Page not found</h1> },
    ],
  },
]);
