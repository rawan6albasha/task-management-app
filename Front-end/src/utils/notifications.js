export const showToast = (message, type = 'info') => {
  // يمكن ربطها بـ react-hot-toast لاحقاً
  console.log(`[${type.toUpperCase()}] ${message}`);
};

export const requestBrowserNotification = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};