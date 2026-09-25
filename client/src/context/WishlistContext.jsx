import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { productService } from '../services/productService';
import { wishlistService } from '../services/wishlistService';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from './AuthContext';

// Guests: product ids in localStorage. Logged-in users: saved in MongoDB.
// A guest wishlist is merged into the account on login.
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, initializing } = useAuth();
  const [products, setProducts] = useState([]);
  const [ids, setIds] = useState(() => new Set(storage.get(STORAGE_KEYS.wishlist, [])));
  const [loading, setLoading] = useState(true);

  const applyProducts = useCallback((list) => {
    setProducts(list);
    setIds(new Set(list.map((p) => p._id)));
  }, []);

  useEffect(() => {
    if (initializing) return;
    let cancelled = false;
    setLoading(true);

    const guestIds = storage.get(STORAGE_KEYS.wishlist, []);
    const request = user
      ? guestIds.length
        ? wishlistService.merge(guestIds).then((data) => {
            storage.remove(STORAGE_KEYS.wishlist);
            return data;
          })
        : wishlistService.get()
      : productService.byIds(guestIds);

    request
      .then(({ products: list }) => !cancelled && applyProducts(list))
      .catch(() => !cancelled && applyProducts([]))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user, initializing, applyProducts]);

  const add = useCallback(
    async (product) => {
      if (user) {
        applyProducts((await wishlistService.add(product._id)).products);
      } else {
        const next = [...products.filter((p) => p._id !== product._id), product];
        storage.set(STORAGE_KEYS.wishlist, next.map((p) => p._id));
        applyProducts(next);
      }
    },
    [user, products, applyProducts]
  );

  const remove = useCallback(
    async (productId) => {
      if (user) {
        applyProducts((await wishlistService.remove(productId)).products);
      } else {
        const next = products.filter((p) => p._id !== productId);
        storage.set(STORAGE_KEYS.wishlist, next.map((p) => p._id));
        applyProducts(next);
      }
    },
    [user, products, applyProducts]
  );

  const isInWishlist = useCallback((productId) => ids.has(productId), [ids]);

  // Returns true when the product is now in the wishlist.
  const toggle = useCallback(
    async (product) => {
      if (ids.has(product._id)) {
        await remove(product._id);
        return false;
      }
      await add(product);
      return true;
    },
    [ids, add, remove]
  );

  const value = useMemo(
    () => ({ products, count: products.length, loading, add, remove, toggle, isInWishlist }),
    [products, loading, add, remove, toggle, isInWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
