import { createBrowserRouter } from "react-router";
import Layout from "./Layout.jsx";
import PlaceholderPage from "./PlaceholderPage.jsx";
import RequireAuth from "./RequireAuth.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import CollectionPage from "../features/collection/CollectionPage.jsx";
import BookDetailPage from "../features/collection/BookDetailPage.jsx";
import BookcasesPage from "../features/bookcases/BookcasesPage.jsx";
import ShelfPage from "../features/bookcases/ShelfPage.jsx";
import UnassignedPage from "../features/bookcases/UnassignedPage.jsx";
import AddBookPage from "../features/books/AddBookPage.jsx";
import ScanBookPage from "../features/books/ScanBookPage.jsx";
import EditBookPage from "../features/books/EditBookPage.jsx";

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
            element: <AddBookPage title="Add a book" />,
          },
          {
            path: "books/scan",
            element: <ScanBookPage title="Add a book by ISBN" />,
          },
          {
            path: "books/:copyId",
            element: <BookDetailPage />,
          },
          {
            path: "books/:copyId/edit",
            element: <EditBookPage />,
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
