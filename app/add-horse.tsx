import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

const AddHorseScreen = () => {
  const router = useRouter();
  const { colors } = useTheme() as ExtendedTheme;
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload a horse image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleAddHorse = async () => {
    if (!name.trim()) {
      Alert.alert("Please enter the name of your horse");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("You must be logged in");
        return;
      }

      const { data: newHorse, error: insertError } = await supabase
        .from("horses")
        .insert([
          {
            name: name.trim(),
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (photoUri && newHorse) {
        try {
          const base64 = await FileSystem.readAsStringAsync(photoUri, {
            encoding: "base64",
          });

          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const filePath = `${user.id}/${newHorse.id}.jpg`;

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

          const { error: updateError } = await supabase
            .from("horses")
            .update({ photo_url: publicUrl })
            .eq("id", newHorse.id);

          if (updateError) throw updateError;
        } catch (photoError) {
          console.error("Photo upload failed:", photoError);
          Alert.alert(
            "Horse added",
            "Horse was added but photo upload failed. You can add a photo later."
          );
        }
      }

      Alert.alert("Success!", `${name} has been added.`);
      router.replace("/");
    } catch (error: any) {
      console.error("Error adding horse:", error);
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg" style={{ color: colors.primary }}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          className="text-2xl font-bold mb-6"
          style={{ color: colors.text }}
        >
          Add a Horse
        </Text>

        {/* Photo Picker */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            className="w-24 h-24 rounded-full items-center justify-center overflow-hidden"
            style={{ backgroundColor: colors.border }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
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
              {photoUri ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text
            className="text-base font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Nickname
          </Text>
          <TextInput
            placeholder="Enter your horse's nickname"
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

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddHorse}
          disabled={uploading}
          className="py-4 rounded-lg"
          style={{
            backgroundColor: uploading ? colors.border : colors.primary,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Add Horse
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddHorseScreen;
