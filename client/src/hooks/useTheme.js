import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useTheme = () => {
  const [theme, setThemeState, removeTheme] = useLocalStorage('theme', 'light');
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
      setThemeState('dark');
    } else {
      htmlElement.classList.remove('dark');
      setThemeState('light');
    }
  }, [isDark, setThemeState]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const setTheme = useCallback((newTheme) => {
    setIsDark(newTheme === 'dark');
  }, []);

  return {
    theme: isDark ? 'dark' : 'light',
    isDark,
    toggleTheme,
    setTheme
  };
};

export default useTheme;
