import { createBrowserRouter } from "react-router";
import Layout from "./Layout.jsx";
import PlaceholderPage from "./PlaceholderPage.jsx";
import RequireAuth from "./RequireAuth.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import CollectionPage from "../features/collection/CollectionPage.jsx";
import BookcasesPage from "../features/bookcases/BookcasesPage.jsx";
import ShelfPage from "../features/bookcases/ShelfPage.jsx";
import UnassignedPage from "../features/bookcases/UnassignedPage.jsx";

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
          {
            path: "books/new",
            element: <PlaceholderPage title="Add a book" />,
          },
          { path: "bookcases", element: <BookcasesPage /> },
          { path: "bookcases/unassigned", element: <UnassignedPage /> },
          {
            path: "bookcases/:bookcaseId/shelves/:shelfId",
            element: <ShelfPage />,
          },
          { path: "picker", element: <PlaceholderPage title="Picker" /> },
        ],
      },
      { path: "*", element: <h1>Page not found</h1> },
    ],
  },
]);
