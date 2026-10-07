import { apiRequest } from "../../api/client.js"

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
