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
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

export default function EditHorseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshHorses } = useHorse();
  const { colors } = useTheme() as ExtendedTheme;
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload a horse image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    await uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    if (!id) return;
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${id}.jpg`;

      if (photoUrl) {
        const cleanUrl = photoUrl.split("?")[0]; // strip any existing ?t=... param
        const oldPath = cleanUrl.split("/horse-photos/")[1];
        await supabase.storage.from("horse-photos").remove([oldPath]);
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from("horse-photos")
        .upload(filePath, bytes.buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("horse-photos").getPublicUrl(filePath);

      // Cache busting so the new img shows
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("horses")
        .update({ photo_url: cacheBustedUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      setPhotoUrl(cacheBustedUrl);
      await refreshHorses();
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
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between p-4 border-b"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg" style={{ color: colors.primary }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Edit Horse
        </Text>
        <TouchableOpacity onPress={handleDelete} className="p-2">
          <Text className="text-md" style={{ color: "#ef7171ff" }}>
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
              className="w-24 h-24 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              {uploading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-5xl">🐴</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              className="mt-3"
            >
              <Text className="font-semibold" style={{ color: colors.primary }}>
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
            <Text
              className="text-base font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Horse Name
            </Text>
            <TextInput
              placeholder="Horse name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="py-4 rounded-lg"
            style={{
              backgroundColor: saving ? colors.border : colors.primary,
            }}
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
