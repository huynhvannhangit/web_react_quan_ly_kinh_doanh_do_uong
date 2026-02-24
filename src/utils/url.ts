export const getImageUrl = (
  path: string | null | undefined,
  fallback = "/placeholder.png",
) => {
  if (!path) return fallback;
  if (path.startsWith("http")) return path;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
  const baseUrl = API_URL.replace(/\/api$/, "");

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getAvatarUrl = (path: string | null | undefined) => {
  return getImageUrl(path, "/avatar.png");
};
