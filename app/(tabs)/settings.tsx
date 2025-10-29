import { View, Text, Button } from "react-native";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Text className="text-xl mb-4">Settings</Text>
      <Button title="Log Out" onPress={handleLogout} />
    </SafeAreaView>
  );
}
