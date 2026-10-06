import { createBrowserRouter } from "react-router";
import Layout from "./Layout.jsx";
import PlaceholderPage from "./PlaceholderPage.jsx";
import RequireAuth from "./RequireAuth.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import CollectionPage from "../features/collection/CollectionPage.jsx";
import BookcasesPage from "../features/bookcases/BookcasesPage.jsx";
import ShelvesPage from "../features/bookcases/ShelvesPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <CollectionPage /> },
          { path: "books/new", element: <PlaceholderPage title="Add a book" /> },
          { path: "bookcases" , element: <BookcasesPage />},
          { path: "bookcases/:bookcaseId/shelves", element: <ShelvesPage /> },
          { path: "shelves", element: <PlaceholderPage title="Shelves" /> },
          { path: "picker", element: <PlaceholderPage title="Picker" /> },
        ],
      },
      { path: "*", element: <h1>Page not found</h1> },
    ],
  },
]);



