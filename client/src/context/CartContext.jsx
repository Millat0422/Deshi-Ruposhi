import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { calculateCartTotals, DEFAULT_PRICING } from '../utils/pricing';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from './AuthContext';

/*
  How the cart works
  ------------------
  - The cart always lives in React state AND localStorage (so a refresh keeps it).
  - Guests: localStorage only. Prices/stock are refreshed from the API on load.
  - Logged-in users: every change is also saved to MongoDB (PUT /api/cart).
    On login, a guest cart is MERGED into the user's saved cart.
  - The server re-checks prices and stock when an order is placed.
*/

const CartContext = createContext(null);
const MAX_QTY = 99;

export const cartKey = (productId, size, color) => `${productId}|${size || ''}|${color || ''}`;

const fromProduct = (product, { size = '', color = '', quantity = 1 }) => ({
  key: cartKey(product._id, size, color),
  productId: product._id,
  slug: product.slug,
  name: product.name,
  image: product.images?.[0] || '',
  price: product.price,
  originalPrice: product.originalPrice || 0,
  stock: product.stock,
  size,
  color,
  quantity,
});

const fromServer = (serverItems) =>
  serverItems
    .filter((item) => item.details)
    .map((item) => fromProduct(item.details, { size: item.size, color: item.color, quantity: item.quantity }));

const loadStored = () => {
  const stored = storage.get(STORAGE_KEYS.cart);
  if (stored && Array.isArray(stored.items)) return stored;
  return { owner: null, items: [] };
};

export function CartProvider({ children }) {
  const { user, initializing } = useAuth();
  const [cart, setCart] = useState(loadStored);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [syncing, setSyncing] = useState(false);

  const syncedFor = useRef(null); // user id the cart has been synced for
  const syncingFor = useRef(null); // user id a sync request is running for
  const currentUserId = useRef(null);
  currentUserId.current = user?._id || null;
  const version = useRef(0); // increases on every user change
  const inFlight = useRef(false);
  const pending = useRef(false);
  const latestItems = useRef(cart.items);
  latestItems.current = cart.items;

  // Persist every change.
  useEffect(() => storage.set(STORAGE_KEYS.cart, cart), [cart]);

  // Load pricing rules (shipping threshold, tax) from the server once.
  useEffect(() => {
    orderService
      .config()
      .then((config) => setPricing({ ...DEFAULT_PRICING, ...config.pricing }))
      .catch(() => {});
  }, []);

  // Save the current cart to the server (one request at a time, always the latest state).
  const pushedVersion = useRef(0);

  const pushToServer = useCallback(async () => {
    if (!syncedFor.current) return;
    if (inFlight.current) {
      pending.current = true;
      return;
    }
    inFlight.current = true;
    const startedAt = version.current;
    try {
      const { items } = await cartService.replace(latestItems.current);
      pushedVersion.current = Math.max(pushedVersion.current, startedAt);
      // Only apply the server's cleaned-up cart if nothing changed meanwhile.
      if (version.current === startedAt) setCart((prev) => ({ ...prev, items: fromServer(items), dirty: false }));
    } catch {
      /* keep local cart; it will be pushed again on the next change */
    } finally {
      inFlight.current = false;
      if (pending.current) {
        pending.current = false;
        pushToServer();
      }
    }
  }, []);

  // React to login / logout.
  useEffect(() => {
    if (initializing) return;
    let cancelled = false;

    if (!user) {
      // Logged out -> drop the previous user's cart from this device.
      syncedFor.current = null;
      setCart((prev) => (prev.owner ? { owner: null, items: [] } : prev));

      // Refresh guest cart prices/stock from the API.
      const ids = [...new Set(latestItems.current.map((item) => item.productId))];
      if (ids.length) {
        productService
          .byIds(ids)
          .then(({ products }) => {
            if (cancelled) return;
            const map = new Map(products.map((p) => [p._id, p]));
            setCart((prev) => ({
              ...prev,
              items: prev.items
                .filter((item) => map.get(item.productId)?.stock > 0)
                .map((item) => {
                  const product = map.get(item.productId);
                  return { ...fromProduct(product, item), quantity: Math.min(item.quantity, product.stock) };
                }),
            }));
          })
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }

    // Guard with a ref so a double-run (e.g. React StrictMode) never merges twice.
    if (syncedFor.current === user._id || syncingFor.current === user._id) return undefined;
    syncingFor.current = user._id;
    const userId = user._id;

    const stored = loadStored();
    const hasGuestItems = !stored.owner && stored.items.length > 0;
    // Same user with changes that never reached the server (e.g. the tab was reloaded
    // mid-save) -> this device's cart is the newest, so save it.
    const hasUnsavedChanges = stored.owner === userId && stored.dirty;
    setSyncing(true);
    const request = hasGuestItems
      ? cartService.merge(stored.items)
      : hasUnsavedChanges
        ? cartService.replace(stored.items)
        : cartService.get();
    request
      .then(({ items }) => {
        if (currentUserId.current !== userId) return;
        syncedFor.current = userId;
        setCart({ owner: userId, items: fromServer(items), dirty: false });
      })
      .catch(() => {
        if (currentUserId.current === userId) syncedFor.current = userId;
      })
      .finally(() => {
        syncingFor.current = null;
        setSyncing(false);
      });

    return undefined;
  }, [user, initializing]);

  // If the tab is closed/reloaded right after a change, send the latest cart anyway.
  useEffect(() => {
    const flush = () => {
      if (!syncedFor.current || version.current === pushedVersion.current) return;
      cartService.flush(latestItems.current);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  // Every user-initiated change goes through here.
  const commit = useCallback(
    (updater) => {
      version.current += 1;
      setCart((prev) => ({ ...prev, items: updater(prev.items), dirty: Boolean(prev.owner) }));
      if (syncedFor.current) setTimeout(pushToServer, 250);
    },
    [pushToServer]
  );

  const addItem = useCallback(
    (product, { size = '', color = '', quantity = 1 } = {}) => {
      if (!product || product.stock <= 0) return { ok: false, message: 'This product is out of stock' };
      if (product.sizes?.length > 0 && !size) return { ok: false, message: 'Please select a size' };

      const chosenColor = color || product.colors?.[0]?.name || '';
      const key = cartKey(product._id, size, chosenColor);
      const existing = latestItems.current.find((item) => item.key === key);
      const otherVariantsQty = latestItems.current
        .filter((item) => item.productId === product._id && item.key !== key)
        .reduce((sum, item) => sum + item.quantity, 0);
      const maxForThisLine = Math.max(0, Math.min(MAX_QTY, product.stock - otherVariantsQty));
      const desired = (existing?.quantity || 0) + quantity;

      if (maxForThisLine === 0 || (existing && existing.quantity >= maxForThisLine)) {
        return { ok: false, message: `Only ${product.stock} in stock — you already have them in your bag` };
      }
      const finalQty = Math.min(desired, maxForThisLine);

      commit((items) => {
        const line = { ...fromProduct(product, { size, color: chosenColor, quantity: finalQty }) };
        return existing ? items.map((item) => (item.key === key ? line : item)) : [...items, line];
      });

      return {
        ok: true,
        message: finalQty < desired ? `Only ${product.stock} available — added the maximum` : `${product.name} added to your bag`,
      };
    },
    [commit]
  );

  const updateQuantity = useCallback(
    (key, quantity) => {
      commit((items) =>
        items
          .map((item) => {
            if (item.key !== key) return item;
            const otherQty = items.filter((i) => i.productId === item.productId && i.key !== key).reduce((s, i) => s + i.quantity, 0);
            const max = Math.max(1, Math.min(MAX_QTY, (item.stock ?? MAX_QTY) - otherQty));
            return { ...item, quantity: Math.max(1, Math.min(quantity, max)) };
          })
      );
    },
    [commit]
  );

  const removeItem = useCallback((key) => commit((items) => items.filter((item) => item.key !== key)), [commit]);
  const clearCart = useCallback(() => commit(() => []), [commit]);

  const totals = useMemo(() => calculateCartTotals(cart.items, pricing), [cart.items, pricing]);

  const value = useMemo(
    () => ({ items: cart.items, totals, pricing, syncing, addItem, updateQuantity, removeItem, clearCart }),
    [cart.items, totals, pricing, syncing, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
