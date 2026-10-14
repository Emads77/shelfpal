import { errorMessage } from "../bookcases/errorMessage.js";

/* Splits an API error into messages for known form fields and a leftover message for everything else */

export function splitServerErrors(err, knownFields) {
  const data = err?.status === 400 ? err.data : null;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { fields: {}, rest: errorMessage(err) };
  }

  const fields = {};
  const leftovers = [];
  for (const [key, value] of Object.entries(data)) {
    const messages = (Array.isArray(value) ? value : [value]).filter(
      (message) => typeof message === "string",
    );
    if (knownFields.includes(key)) fields[key] = messages;
    else leftovers.push(...messages);
  }

  const hasFieldMessage = Object.values(fields).some((m) => m.length > 0);
  if (!hasFieldMessage && leftovers.length === 0) {
    return { fields: {}, rest: errorMessage(err) };
  }
  return { fields, rest: leftovers.join(" ") };
}
