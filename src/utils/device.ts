export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server-side";

  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId ?? "device-unknown";
};
