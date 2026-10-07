export function errorMessage(err) {
  const data = err?.data;
  const field = data?.name ?? data?.names;
  if (Array.isArray(field)) return field.join(" ");
  if (field && typeof field === "object") {
    return "Each shelf needs a name of at most 200 characters.";
  }
  return data?.detail ?? err?.message ?? "Something went wrong. Please try again.";
}
