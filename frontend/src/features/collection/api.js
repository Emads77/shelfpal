import { mockCollection } from "./mockBooks.js";

// Mock only for now. When the backend endpoint exists, replace

export async function getCollection() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCollection;
}
