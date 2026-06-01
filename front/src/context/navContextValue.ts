import { createContext } from 'react';

export interface NavContextType {
  isNavVisible: boolean;
  setIsNavVisible: (visible: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const NavContext = createContext<NavContextType | undefined>(undefined);
