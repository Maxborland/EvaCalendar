import { useState, type ReactNode } from 'react';
import { NavContext } from './navContextValue';

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <NavContext.Provider value={{ isNavVisible, setIsNavVisible, isModalOpen, setIsModalOpen }}>
      {children}
    </NavContext.Provider>
  );
};
