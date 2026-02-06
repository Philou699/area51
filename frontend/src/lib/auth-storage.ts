export type StoredAuthUser = {
  id: string;
  email: string;
  roles: string[];
};

type RawAuthUser = {
  id: string | number;
  email: string;
  roles?: unknown;
};

interface SaveAuthSessionOptions {
  user: RawAuthUser;
  accessToken?: string;
  rememberMe?: boolean;
}

const ACCESS_TOKEN_KEY = 'auth_access_token';
const USER_KEY = 'auth_user';
export const AUTH_STATE_EVENT = 'auth:changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function normaliseUser(raw: RawAuthUser): StoredAuthUser {
  const roles =
    Array.isArray(raw.roles) && raw.roles.length > 0
      ? raw.roles.map((role) => String(role))
      : [];

  return {
    id: String(raw.id),
    email: raw.email,
    roles,
  };
}

function getStorage(rememberMe: boolean | undefined) {
  if (!isBrowser()) {
    return null;
  }

  return rememberMe ? window.localStorage : window.sessionStorage;
}

function dispatchAuthEvent(): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export function saveAuthSession(options: SaveAuthSessionOptions): void {
  if (!isBrowser()) {
    return;
  }

  const user = normaliseUser(options.user);
  const storage = getStorage(options.rememberMe) ?? window.localStorage;
  const alternateStorage =
    storage === window.localStorage ? window.sessionStorage : window.localStorage;

  try {
    storage.setItem(USER_KEY, JSON.stringify(user));

    if (options.accessToken) {
      storage.setItem(ACCESS_TOKEN_KEY, options.accessToken);
    } else {
      storage.removeItem(ACCESS_TOKEN_KEY);
    }

    alternateStorage.removeItem(USER_KEY);
    alternateStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn('[auth-storage] Unable to persist auth session', error);
  }

  dispatchAuthEvent();
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);

  dispatchAuthEvent();
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw =
    window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return {
        id: parsed.id,
        email: parsed.email,
        roles: Array.isArray(parsed.roles) ? parsed.roles : [],
      };
    }
  } catch (error) {
    console.warn('[auth-storage] Unable to parse stored auth user', error);
  }

  return null;
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getActiveAuthStorage(): 'local' | 'session' {
  if (!isBrowser()) {
    return 'local';
  }

  if (
    window.localStorage.getItem(USER_KEY) ||
    window.localStorage.getItem(ACCESS_TOKEN_KEY)
  ) {
    return 'local';
  }

  if (
    window.sessionStorage.getItem(USER_KEY) ||
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  ) {
    return 'session';
  }

  return 'local';
}
