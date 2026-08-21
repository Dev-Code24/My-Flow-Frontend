export function setSessionStorageValue(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

export function getSessionStorageValue(key: string): string | null {
  return sessionStorage.getItem(key);
}

export function removeSessionStorageValue(key: string): void {
  sessionStorage.removeItem(key);
}