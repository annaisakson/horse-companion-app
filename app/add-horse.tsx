import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

const AddHorseScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddHorse = async () => {
    if (!name.trim()) {
      Alert.alert("Please enter the name of your horse");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("You must be logged in");
      return;
    }

    const { error } = await supabase.from("horses").insert([
      {
        name,
        owner_id: user.id,
      },
    ]);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Success!", `${name} has been added.`);
    router.replace("/"); // go back to home
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-6">Add a Horse</Text>
      <TextInput
        placeholder="Horse name"
        className="w-full border p-2 mb-4 rounded"
        value={name}
        onChangeText={setName}
      />
      <Button title="Add Horse" onPress={handleAddHorse} />
      <Button title="Log out" onPress={handleLogout} />
    </SafeAreaView>
  );
};

export default AddHorseScreen;
