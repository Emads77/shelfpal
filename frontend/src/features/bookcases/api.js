import { apiRequest } from "../../api/client.js";

export function getLibraryOverview() {
  return apiRequest("/overview/");
}

export function createBookcase(name) {
  return apiRequest("/bookcases/", { method: "POST", body: { name } });
}

export function updateBookcase(bookcaseId, name) {
  return apiRequest(`/bookcases/${bookcaseId}/`, {
    method: "PATCH",
    body: { name },
  });
}

export function removeBookcase(bookcaseId) {
  return apiRequest(`/bookcases/${bookcaseId}/`, { method: "DELETE" });
}

export function createShelves(bookcaseId, names) {
  return apiRequest(`/bookcases/${bookcaseId}/shelves/bulk/`, {
    method: "POST",
    body: { names },
  });
}

export function updateShelf(bookcaseId, shelfId, name) {
  return apiRequest(`/bookcases/${bookcaseId}/shelves/${shelfId}/`, {
    method: "PATCH",
    body: { name },
  });
}

export function removeShelf(bookcaseId, shelfId) {
  return apiRequest(`/bookcases/${bookcaseId}/shelves/${shelfId}/`, {
    method: "DELETE",
  });
}

export function getCopies({ shelf, unassigned } = {}) {
  const params = new URLSearchParams();
  if (shelf !== undefined) params.set("shelf", String(shelf));
  if (unassigned) params.set("unassigned", "true");
  const query = params.toString();
  return apiRequest(`/copies/${query ? `?${query}` : ""}`);
}

export function moveCopies(ids, shelfId) {
  return apiRequest("/copies/move/", {
    method: "POST",
    body: { ids, shelf: shelfId },
  });
}

export function deleteCopies(ids) {
  return apiRequest("/copies/delete/", { method: "POST", body: { ids } });
}

export function addBookManually(data) {
  return apiRequest("/copies/", { method: "POST", body: data });
}

