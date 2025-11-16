import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Themes, DefaultLight } from "../utilities/themes";
import { Theme } from "@react-navigation/native";

type ThemeKey = keyof typeof Themes;

type ThemeContextType = {
  theme: Theme;
  themeKey: ThemeKey;
  setAppTheme: (key: ThemeKey) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: DefaultLight,
  themeKey: "light",
  setAppTheme: async () => {},
});

export const ThemeProviderCustom = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [themeKey, setThemeKey] = useState<ThemeKey>("light");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("theme");
      if (saved && saved in Themes) {
        setThemeKey(saved as ThemeKey);
      }
    })();
  }, []);

  const setAppTheme = async (key: ThemeKey) => {
    setThemeKey(key);
    await AsyncStorage.setItem("theme", key);
  };

  return (
    <ThemeContext.Provider
      value={{ theme: Themes[themeKey], themeKey, setAppTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
