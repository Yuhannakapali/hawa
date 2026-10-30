// Push delivery needs the devices/alerts backend; native permission is wired with Firebase later.
export async function requestAlertPermission(): Promise<boolean> {
  return false;
}
