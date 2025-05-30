import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NavContextType {
  isNavVisible: boolean;
  setIsNavVisible: (visible: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export const NavProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <NavContext.Provider value={{ isNavVisible, setIsNavVisible, isModalOpen, setIsModalOpen }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
};