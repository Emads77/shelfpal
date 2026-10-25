import { expect } from "@playwright/test";

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function createBookcase(request, token, name, shelfNames = []) {
  const response = await request.post("/api/bookcases/", {
    headers: auth(token),
    data: { name },
  });
  expect(response.status(), await response.text()).toBe(201);
  const bookcase = await response.json();

  let shelves = [];
  if (shelfNames.length > 0) {
    const bulk = await request.post(
      `/api/bookcases/${bookcase.id}/shelves/bulk/`,
      {
        headers: auth(token),
        data: { names: shelfNames },
      },
    );
    expect(bulk.status(), await bulk.text()).toBe(201);
    shelves = await bulk.json();
  }
  return { ...bookcase, shelves };
}

export async function createCopy(
  request,
  token,
  { title, author, shelf = null },
) {
  const response = await request.post("/api/copies/", {
    headers: auth(token),
    data: { title, author, shelf },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function fetchCopy(request, token, id) {
  return request.get(`/api/copies/${id}/`, { headers: auth(token) });
}

export async function listCopies(request, token) {
  const response = await request.get("/api/copies/", { headers: auth(token) });
  expect(response.status()).toBe(200);
  return response.json();
}

export async function listBookcases(request, token) {
  const response = await request.get("/api/bookcases/", {
    headers: auth(token),
  });
  expect(response.status()).toBe(200);
  return response.json();
}
