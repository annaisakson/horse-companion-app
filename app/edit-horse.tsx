import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { useHorse } from "../lib/HorseContext";

export default function EditHorseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshHorses } = useHorse();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchHorse();
  }, [id]);

  const fetchHorse = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching horse:", error);
      Alert.alert("Error", "Could not load horse");
      router.back();
      return;
    }

    setName(data.name || "");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Horse name cannot be empty");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("horses")
      .update({ name: name.trim() })
      .eq("id", id);

    if (error) {
      console.error("Error updating horse:", error);
      Alert.alert("Error", "Could not update horse");
      setSaving(false);
      return;
    }

    Alert.alert("Success!", "Horse updated");
    await refreshHorses(); // Refresh the horse list in context
    setSaving(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Horse",
      "Are you sure you want to delete this horse? All activities will also be deleted. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("horses")
              .delete()
              .eq("id", id);

            if (error) {
              console.error("Error deleting horse:", error);
              Alert.alert("Error", "Could not delete horse");
              return;
            }

            Alert.alert("Deleted", "Horse has been deleted");
            await refreshHorses();
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-500 text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold">Edit Horse</Text>
        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          className="p-2 rounded-lg bg-red-700"
        >
          <Text className="text-white text-center font-bold text-sm">
            Delete
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-4">
        {/* Horse Icon */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center">
            <Text className="text-5xl">🐴</Text>
          </View>
          <TouchableOpacity className="mt-3">
            <Text className="text-blue-500 font-semibold">
              Change Photo (Coming Soon)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold mb-2">Horse Name</Text>
          <TextInput
            placeholder="Horse name"
            value={name}
            onChangeText={setName}
            className="bg-white p-4 rounded-lg border border-gray-200"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-lg mb-3 ${
            saving ? "bg-gray-400" : "bg-blue-500"
          }`}
        >
          <Text className="text-white text-center font-bold text-lg">
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
