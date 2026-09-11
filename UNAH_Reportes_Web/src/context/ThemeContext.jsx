import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    const siguienteTema = tema === 'light' ? 'dark' : 'light';
    const actualizarTema = () => {
      document.documentElement.setAttribute('data-theme', siguienteTema);
      localStorage.setItem('tema', siguienteTema);
      setTema(siguienteTema);
    };
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (document.startViewTransition && !reducirMovimiento) {
      document.startViewTransition(() => flushSync(actualizarTema));
      return;
    }

    actualizarTema();
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
