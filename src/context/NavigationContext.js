import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [screen, setScreen] = useState('dashboard');
  const [params, setParams] = useState({});

  const navigate = (screenName, screenParams = {}) => {
    setScreen(screenName);
    setParams(screenParams);
  };

  return (
    <NavigationContext.Provider value={{ screen, params, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
