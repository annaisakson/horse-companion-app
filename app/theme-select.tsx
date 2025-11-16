import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../lib/ThemeContext";
import { useRouter } from "expo-router";
import { Themes } from "../utilities/themes";

export default function ThemeSelectScreen() {
  const { themeKey, setAppTheme } = useAppTheme();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 px-6 pt-6 bg-background">
      <Text className="text-3xl font-bold mb-6">Choose Theme</Text>

      {Object.keys(Themes).map((key) => (
        <TouchableOpacity
          key={key}
          className={`p-4 mb-3 rounded-xl border ${
            themeKey === key
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
          onPress={() => {
            setAppTheme(key as keyof typeof Themes);
            router.back();
          }}
        >
          <Text
            className={`text-lg ${
              themeKey === key ? "text-blue-700" : "text-gray-700"
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} Theme
          </Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}
