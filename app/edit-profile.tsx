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
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setName(data.name || "");
      setEmail(data.email || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Could not update profile");
    } else {
      Alert.alert("Success!", "Profile updated");
      router.back();
    }

    setSaving(false);
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
        <Text className="text-xl font-bold">Edit Profile</Text>
        <View className="w-16" />
      </View>

      <View className="p-4">
        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold mb-2">Name</Text>
          <TextInput
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            className="bg-white p-4 rounded-lg border border-gray-200"
          />
        </View>

        {/* Email (read-only) */}
        <View className="mb-6">
          <Text className="text-base font-semibold mb-2">Email</Text>
          <View className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <Text className="text-gray-600">{email}</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-1">
            Email cannot be changed
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-lg ${
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
