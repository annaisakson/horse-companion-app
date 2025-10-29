import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HorseSelector from "../../components/HorseSelector";

export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <HorseSelector />
      <Text className="text-xl">Calendar Screen</Text>
    </SafeAreaView>
  );
}
