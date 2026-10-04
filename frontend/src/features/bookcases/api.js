import { apiRequest } from "../../api/client";

export function getBookcases(){
  return apiRequest("/bookcases/");
}
