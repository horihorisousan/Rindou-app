'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MenuContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <MenuContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
