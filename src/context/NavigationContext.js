import React, { createContext, useContext, useState, useRef } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [screen, setScreen] = useState('dashboard');
  const [params, setParams] = useState({});
  // Incrementing this signals AppSidebar to open the New Project modal
  const [newProjectSeq, setNewProjectSeq] = useState(0);

  const navigate = (screenName, screenParams = {}) => {
    setScreen(screenName);
    setParams(screenParams);
  };

  const triggerNewProject = () => setNewProjectSeq((n) => n + 1);

  return (
    <NavigationContext.Provider value={{ screen, params, navigate, newProjectSeq, triggerNewProject }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
