// @src/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme as rnUseColorScheme } from 'react-native';
import { LIGHT, DARK } from './colors';
import { getItem, setItem } from '@src/storage/mmkvStorage';

type Theme = typeof LIGHT;
type ThemeContextType = {
  theme: Theme;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
};

const KEY = 'FEEDOMAC_THEME';

const ThemeContext = createContext<ThemeContextType>({
  theme: LIGHT,
  mode: 'light',
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sys = rnUseColorScheme();
  const [mode, setModeState] = useState<'light' | 'dark'>((() => {
    const s = getItem(KEY);
    if (s === 'dark' || s === 'light') return s;
    return sys === 'dark' ? 'dark' : 'light';
  })());

  useEffect(() => {
    // listen to system changes only if user hasn't forced a mode
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      const stored = getItem(KEY);
      if (!stored) {
        setModeState(colorScheme === 'dark' ? 'dark' : 'light');
      }
    });
    return () => listener.remove();
  }, []);

  const setMode = (m: 'light' | 'dark') => {
    setItem(KEY, m);
    setModeState(m);
  };

  const theme = mode === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
