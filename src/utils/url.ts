export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return "/avatar.png";
  if (path.startsWith("http")) return path;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
  
  // The API_URL usually ends with /api, but static files are served from the root
  // So we strip /api from the end of the URL
  const baseUrl = API_URL.replace(/\/api$/, "");
  
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};
