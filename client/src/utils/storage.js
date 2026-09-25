// Safe localStorage wrapper (never crashes in private mode / when storage is full).
export const STORAGE_KEYS = {
  token: 'orixa_token',
  cart: 'orixa_cart',
  wishlist: 'orixa_wishlist',
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy errors */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
