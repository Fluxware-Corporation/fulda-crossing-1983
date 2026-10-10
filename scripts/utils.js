export function normalizePath(filePath) {
  let normalized = filePath.split("\\").join("/");

  if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  return normalized;
}

export function isBlank(value) {
  return value.trim().length === 0;
}
