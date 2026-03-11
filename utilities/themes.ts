import { DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { Platform } from "react-native";

export interface ExtendedTheme extends Theme {
  colors: Theme["colors"] & {
    textSecondary: string;
    secondary: string;
    horseBorder: string;
    bar: string;
  };
}

export const DefaultLight: ExtendedTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: "#9daed5ff",
    secondary: "#d4ddf3ff",
    background: "#FAFAFA",
    card: "#FFFFFF",
    text: "#1e1e1eff",
    textSecondary: "#5a5959ff",
    border: "#E0E0E0",
    notification: "#7685C0",
    horseBorder: "#E0E0E0",
    bar: "#FFFFFF",
  },
  fonts: {
    regular: {
      fontFamily:
        Platform.OS === "web"
          ? 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          : "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily:
        Platform.OS === "web"
          ? 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          : "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily:
        Platform.OS === "web"
          ? 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          : "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily:
        Platform.OS === "web"
          ? 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          : "System",
      fontWeight: "900",
    },
  },
};

export const DefaultDark: ExtendedTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: "#ce7b41ff",
    secondary: "#e09661ff",
    background: "#121212",
    card: "#1E1E1E",
    text: "#e5e4e4ff",
    textSecondary: "#545454ff",
    border: "#272729",
    notification: "#1b2743ff",
    horseBorder: "#272729",
    bar: "#1E1E1E",
  },
  fonts: DefaultLight.fonts, // reuse same fonts
};

export const Themes = {
  light: DefaultLight,
  dark: DefaultDark,
  blue: {
    ...DefaultLight,
    colors: {
      ...DefaultLight.colors,
      primary: "#57a0f3",
      background: "#ddebfb",
      secondary: "#ccd9fb",
      border: "#cee3fb",
      horseBorder: "#57a0f370",
      bar: "#eaf5ff",
    },
  },
  green: {
    ...DefaultLight,
    colors: {
      ...DefaultLight.colors,
      primary: "#8ed482",
      background: "#dffbd1",
      secondary: "#d2fabe",
      border: "#d0faba",
      horseBorder: "#8ed48270",
      bar: "#eafce1",
    },
  },
  pink: {
    ...DefaultLight,
    colors: {
      ...DefaultLight.colors,
      primary: "#e099c1",
      background: "#fbd1e0",
      secondary: "#ffd0ec",
      card: "#faf0f3",
      border: "#fcdee9",
      horseBorder: "#e099c170",
      bar: "#ffd8e5",
    },
  },
};
