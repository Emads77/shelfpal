import { Inbox, Library } from "lucide-react";

export function placeOf(location) {
  if (!location) {
    return {
      to: "/bookcases/unassigned",
      icon: Inbox,
      bookcase: null,
      shelf: "Unassigned",
    };
  }
  return {
    to: `/bookcases/${location.bookcase_id}/shelves/${location.shelf_id}`,
    icon: Library,
    bookcase: location.bookcase_name,
    shelf: location.shelf_name,
  };
}
