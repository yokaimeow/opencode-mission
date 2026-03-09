/**
 * Cookie utility functions
 *
 * Note: Client manages auth cookies
 * Use setCookie/deleteCookie to manage token storage
 */

/**
 * Set a cookie with the given name, value, and options
 * Note: Cannot set httpOnly cookies from client-side JavaScript
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void {
  if (typeof document === 'undefined') return;

  const {
    maxAge,
    expires,
    path = '/',
    secure = true,
    sameSite = 'lax',
  } = options;

  let cookieString = `${name}=${value}; path=${path}`;

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * Used to check if httpOnly auth cookies are present
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }

  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: { path?: string; domain?: string } = {}): void {
  if (typeof document === 'undefined') return;

  const { path = '/' } = options;

  // Set cookie with expired date to delete it
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
