import { apiRequest } from "../../api/client.js";

export function register({ username, email, password }) {
  return apiRequest("/auth/register/", {
    method: "POST",
    body: { username, email, password },
  });
}
