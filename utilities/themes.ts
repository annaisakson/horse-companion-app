import { DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { Platform } from "react-native";

export interface ExtendedTheme extends Theme {
  colors: Theme["colors"] & {
    textSecondary: string;
    secondary: string;
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
    primary: "#222a4bff",
    secondary: "#121729ff",
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "#2d2d2dff",
    border: "#272729",
    notification: "#1b2743ff",
  },
  fonts: DefaultLight.fonts, // reuse same fonts
};

export const Themes = {
  light: DefaultLight,
  dark: DefaultDark,
  blue: {
    ...DefaultLight,
    colors: { ...DefaultLight.colors, primary: "#0070f3" },
  },
  green: {
    ...DefaultLight,
    colors: { ...DefaultLight.colors, primary: "#22c55e" },
  },
};
