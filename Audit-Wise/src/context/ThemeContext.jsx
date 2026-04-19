import React, { createContext, useState, useContext, useEffect } from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setDarkMode(prefersDark);
    }
    setIsLoading(false);
  }, []);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#6366f1",
      },
      secondary: {
        main: "#38bdf8",
      },
      background: {
        default: darkMode ? "#0f172a" : "#f8fafc",
        paper: darkMode ? "#1e293b" : "#ffffff",
      },
    },
  });

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("darkMode", darkMode);
      if (darkMode) {
        document.documentElement.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark-mode");
      }
    }
  }, [darkMode, isLoading]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
