import { apiRequest } from "../../api/client";




//bookcases

export function getBookcase(id) {
  return apiRequest(`/bookcases/${id}/`);
}

export function getBookcases(){
  return apiRequest("/bookcases/");
}

export function createBookcase({name}){
 return apiRequest("/bookcases/",{
  method: "POST",
  body: {name},
 });
}

export function removeBookcase(id) {
  return apiRequest(`/bookcases/${id}/`, {
    method: "DELETE",
  });
}

export function updateBookcase(id, name) {
  return apiRequest(`/bookcases/${id}/`, {
    method: "PATCH",
    body: { name },
  });
}

//shelves
export function getShelves(bookcaseId) {
  return apiRequest(`/bookcases/${bookcaseId}/shelves/`);
}

export function createShelf(bookcaseId, name) {
  return apiRequest(`/bookcases/${bookcaseId}/shelves/`, {
    method: "POST",
    body: { name },
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
