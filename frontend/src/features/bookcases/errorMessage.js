function firstMessage(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(firstMessage).filter(Boolean).join(" ");
  }
  if (value && typeof value === "object") {
    for (const inner of Object.values(value)) {
      const message = firstMessage(inner);
      if (message) return message;
    }
  }
  return "";
}

export function errorMessage(err) {
  return (
    firstMessage(err?.data) ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}
