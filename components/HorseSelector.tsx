import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useHorse } from "../lib/HorseContext";

export default function HorseSelector() {
  const { horses, selectedHorseId, setSelectedHorseId } = useHorse();
  const router = useRouter();

  if (horses.length === 0) {
    return null;
  }

  return (
    <View className="bg-white p-4 border-b border-gray-200 flex-row items-center justify-between">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {horses.map((horse) => (
          <TouchableOpacity
            key={horse.id}
            onPress={() => setSelectedHorseId(horse.id)}
            className={`mr-3 px-5 py-2 rounded-full flex items-center ${
              selectedHorseId === horse.id ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <Text
              className={`font-semibold ${
                selectedHorseId === horse.id ? "text-white" : "text-gray-700"
              }`}
            >
              🐴
              {/* {horse.img} */}
            </Text>
            <Text
              className={`font-semibold ${
                selectedHorseId === horse.id ? "text-white" : "text-gray-700"
              }`}
            >
              {horse.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="mb-2">
        <TouchableOpacity onPress={() => router.push("/add-horse")}>
          <Text className="text-blue-500 font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
