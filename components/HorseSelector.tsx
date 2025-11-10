import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useHorse } from "../lib/HorseContext";

export default function HorseSelector() {
  const { horses, selectedHorseId, setSelectedHorseId } = useHorse();
  const router = useRouter();
  const pathname = usePathname();

  if (horses.length === 0) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <View className="bg-white p-4 border-b border-gray-200 flex-row items-center justify-between">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {horses.map((horse) => (
          <TouchableOpacity
            key={horse.id}
            onPress={() => setSelectedHorseId(horse.id)}
            className="mr-3 items-center"
          >
            {/* Photo Container */}
            <View
              className={`w-16 h-16 rounded-full items-center justify-center overflow-hidden border-4 mb-2 ${
                selectedHorseId === horse.id
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 bg-gray-200"
              }`}
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
              className={`text-sm font-semibold text-center max-w-[70px] ${
                selectedHorseId === horse.id ? "text-blue-500" : "text-gray-700"
              }`}
              numberOfLines={1}
            >
              {horse.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="mb-2">
        {/* Only show Add button on home */}
        {isHome && (
          <TouchableOpacity onPress={() => router.push("/add-horse")}>
            <Text className="text-blue-500 font-semibold">+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
