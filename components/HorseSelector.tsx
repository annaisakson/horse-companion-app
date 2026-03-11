import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useHorse } from "../lib/HorseContext";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

export default function HorseSelector() {
  const { horses, selectedHorseId, setSelectedHorseId } = useHorse();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme() as ExtendedTheme;

  if (horses.length === 0) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <View
      className="p-4 flex-row items-center justify-between shadow-sm"
      style={{
        backgroundColor: colors.bar,
        borderColor: colors.border,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {horses.map((horse) => (
          <TouchableOpacity
            key={horse.id}
            onPress={() => setSelectedHorseId(horse.id)}
            className="mr-3 items-center"
          >
            {/* Photo Container */}
            <View
              className="rounded-full items-center justify-center overflow-hidden border-4 mb-2 shadow-sm"
              style={{
                width: selectedHorseId === horse.id ? 68 : 62,
                height: selectedHorseId === horse.id ? 68 : 62,
                borderColor:
                  selectedHorseId === horse.id
                    ? colors.primary
                    : colors.horseBorder,
                backgroundColor: colors.background,
              }}
            >
              {horse.photo_url ? (
                <Image
                  source={{ uri: horse.photo_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl">🐴</Text>
              )}
            </View>

            {/* Horse Name */}
            <Text
              className="text-sm font-semibold text-center max-w-[70px]"
              style={{
                color:
                  selectedHorseId === horse.id
                    ? colors.primary
                    : colors.horseBorder,
              }}
              numberOfLines={1}
            >
              {horse.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="mb-2">
        {isHome && (
          <TouchableOpacity onPress={() => router.push("/add-horse")}>
            <Text className="font-semibold" style={{ color: colors.primary }}>
              + Add
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
