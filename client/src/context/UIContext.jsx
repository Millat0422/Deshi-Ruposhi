import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Small global UI state: cart drawer, search overlay, mobile menu.
const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openCart = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      cartOpen,
      openCart,
      closeCart: () => setCartOpen(false),
      searchOpen,
      openSearch: () => {
        setMenuOpen(false);
        setSearchOpen(true);
      },
      closeSearch: () => setSearchOpen(false),
      menuOpen,
      openMenu: () => setMenuOpen(true),
      closeMenu: () => setMenuOpen(false),
    }),
    [cartOpen, openCart, searchOpen, menuOpen]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
