import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  successMessage: string;
  setSuccessMessage: (message: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const value = {
    isLoading,
    setIsLoading,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};