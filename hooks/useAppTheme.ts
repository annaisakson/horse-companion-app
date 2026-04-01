import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

export function useAppTheme() {
  return useTheme() as ExtendedTheme;
}
