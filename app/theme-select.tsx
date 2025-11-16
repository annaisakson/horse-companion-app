import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../lib/ThemeContext";
import { useRouter } from "expo-router";
import { Themes } from "../utilities/themes";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

export default function ThemeSelectScreen() {
  const { themeKey, setAppTheme } = useAppTheme();
  const { colors } = useTheme() as ExtendedTheme;
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1 px-6 pt-6"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View className="mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg mb-4" style={{ color: colors.primary }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Choose Theme
        </Text>
      </View>

      {Object.keys(Themes).map((key) => (
        <TouchableOpacity
          key={key}
          className="p-4 mb-3 rounded-xl border-2"
          style={{
            borderColor: themeKey === key ? colors.primary : colors.border,
            backgroundColor: themeKey === key ? colors.secondary : colors.card,
          }}
          onPress={() => {
            setAppTheme(key as keyof typeof Themes);
            router.back();
          }}
        >
          <Text
            className="text-lg font-semibold"
            style={{
              color: themeKey === key ? colors.primary : colors.text,
            }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} Theme
          </Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}
