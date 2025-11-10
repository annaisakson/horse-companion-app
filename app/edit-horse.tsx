import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { useHorse } from "../lib/HorseContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

export default function EditHorseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshHorses } = useHorse();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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
    setPhotoUrl(data.photo_url || null);
    setLoading(false);
  };

  const pickImage = async () => {
    // Request permission to access media library
    // Required on iOS and Android
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload a horse image."
      );
      return;
    }

    // Launch the image picker
    // This opens the device's photo gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    // If user cancelled, do nothing
    if (result.canceled) {
      return;
    }

    // If user selected an image, upload it
    await uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    if (!id) return;
    setUploading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${id}.jpg`;

      // Delete old photo if exists
      if (photoUrl) {
        const oldPath = photoUrl.split("/horse-photos/")[1];
        await supabase.storage.from("horse-photos").remove([oldPath]);
      }

      // ✅ Use the legacy API safely
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // Convert base64 → binary
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload binary data to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("horse-photos")
        .upload(filePath, bytes.buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("horse-photos").getPublicUrl(filePath);

      // Update horse record
      const { error: updateError } = await supabase
        .from("horses")
        .update({ photo_url: publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      // Refresh UI
      setPhotoUrl(publicUrl);
      await refreshHorses();

      Alert.alert("Success!", "Photo updated");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Could not upload photo: " + error.message);
    } finally {
      setUploading(false);
    }
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
    await refreshHorses();
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
            // If there's a photo, delete it from storage first
            if (photoUrl) {
              const filePath = photoUrl.split("/horse-photos/")[1];
              await supabase.storage.from("horse-photos").remove([filePath]);
            }

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
        <View className="flex-1">
          {/* Horse Photo */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center overflow-hidden"
            >
              {uploading ? (
                <ActivityIndicator size="large" />
              ) : photoUrl ? (
                // Display the uploaded photo
                <Image
                  source={{ uri: photoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                // Show emoji if no photo
                <Text className="text-5xl">🐴</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              className="mt-3"
            >
              <Text className="text-blue-500 font-semibold">
                {uploading
                  ? "Uploading..."
                  : photoUrl
                    ? "Change Photo"
                    : "Add Photo"}
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
            className={`py-4 rounded-lg ${saving ? "bg-gray-400" : "bg-blue-500"}`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
