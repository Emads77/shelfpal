import { useState } from "react";
import { updateCopy } from "../bookcases/api.js";
import { errorMessage } from "../bookcases/errorMessage.js";
import { statusOf } from "./statusMeta.js";

export function useStatusChange(patch) {
  const [error, setError] = useState("");

  async function changeStatus(copy, next) {
    const previous = statusOf(copy);
    setError("");
    patch(copy.id, { status: next });
    try {
      await updateCopy(copy.id, { status: next });
    } catch (err) {
      patch(copy.id, { status: previous });
      setError(errorMessage(err));
    }
  }

  return { changeStatus, error };
}
