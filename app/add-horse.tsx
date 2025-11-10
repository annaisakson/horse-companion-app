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

const AddHorseScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null); // Store selected photo temporarily
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const pickImage = async () => {
    // Request permission to access photos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload a horse image."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, // Allow cropping
      aspect: [1, 1], // Square crop
      quality: 0.7, // Compress image
    });

    // If user selected an image, store it temporarily
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
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("You must be logged in");
        return;
      }

      // Step 1: Create the horse record in the database
      // We need the horse ID to upload the photo with the right filename
      const { data: newHorse, error: insertError } = await supabase
        .from("horses")
        .insert([
          {
            name: name.trim(),
            owner_id: user.id,
          },
        ])
        .select() // This returns the newly created horse with its ID
        .single();

      if (insertError) throw insertError;

      // Step 2: If user selected a photo, upload it
      if (photoUri && newHorse) {
        try {
          // Read the image file as base64
          const base64 = await FileSystem.readAsStringAsync(photoUri, {
            encoding: "base64",
          });

          // Convert base64 to binary
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create file path: {userId}/{horseId}.jpg
          const filePath = `${user.id}/${newHorse.id}.jpg`;

          // Upload to Supabase Storage
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

          // Step 3: Update the horse record with the photo URL
          const { error: updateError } = await supabase
            .from("horses")
            .update({ photo_url: publicUrl })
            .eq("id", newHorse.id);

          if (updateError) throw updateError;
        } catch (photoError) {
          console.error("Photo upload failed:", photoError);
          // Don't fail the whole operation if photo upload fails
          // The horse is created, just without a photo
          Alert.alert(
            "Horse added",
            "Horse was added but photo upload failed. You can add a photo later."
          );
        }
      }

      Alert.alert("Success!", `${name} has been added.`);
      router.replace("/"); // Go back to home
    } catch (error: any) {
      console.error("Error adding horse:", error);
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-lg">← Back</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold mb-6">Add a Horse</Text>

        {/* Photo Picker */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center overflow-hidden"
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
            <Text className="text-blue-500 font-semibold">
              {photoUri ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold mb-2">Horse Name</Text>
          <TextInput
            placeholder="Enter horse name"
            className="bg-white p-4 rounded-lg border border-gray-200"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddHorse}
          disabled={uploading}
          className={`py-4 rounded-lg ${uploading ? "bg-gray-400" : "bg-blue-500"}`}
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
