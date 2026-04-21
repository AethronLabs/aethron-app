import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getColors } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme === 'light' ? 'light' : 'dark');

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const colors = getColors(theme);

  return (
    <ThemeContext.Provider value={{ theme, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
