const USER_KEY = "ninja-studio-user";

export function readNinjaUser(): string | null {
  try {
    const value = localStorage.getItem(USER_KEY)?.trim();
    return value ? value : null;
  } catch {
    return null;
  }
}

export function writeNinjaUser(name: string): void {
  try {
    localStorage.setItem(USER_KEY, name);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearNinjaUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}
