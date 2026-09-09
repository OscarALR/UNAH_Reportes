import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}