/// <reference lib="dom" />

export async function requestAlertPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') {
    return false;
  }
  const result = await Notification.requestPermission();
  return result === 'granted';
}
