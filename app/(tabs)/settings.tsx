import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useHorse } from "../../lib/HorseContext";
import { useState, useEffect } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const { horses } = useHorse();
  const [profile, setProfile] = useState<any>(null);

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
      setProfile(data);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 bg-white border-b border-gray-200">
          <Text className="text-3xl font-bold">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="p-4">
          <Text className="text-sm text-gray-500 uppercase font-semibold mb-3 px-2">
            Profile
          </Text>
          <View className="bg-white rounded-lg mb-6">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-sm text-gray-500 mb-1">Name</Text>
              <Text className="text-base font-medium">
                {profile?.name || "Not set"}
              </Text>
            </View>
            <View className="p-4 border-b border-gray-100">
              <Text className="text-sm text-gray-500 mb-1">Email</Text>
              <Text className="text-base font-medium">
                {profile?.email || "Not set"}
              </Text>
            </View>
            <TouchableOpacity
              className="p-4 flex-row justify-between items-center"
              onPress={() => router.push("/edit-profile")}
            >
              <Text className="text-base text-blue-500 font-semibold">
                Edit Profile
              </Text>
              <Text className="text-blue-500">→</Text>
            </TouchableOpacity>
          </View>

          {/* Horses Section */}
          <Text className="text-sm text-gray-500 uppercase font-semibold mb-3 px-2">
            Your Horses
          </Text>
          <View className="bg-white rounded-lg mb-6">
            {horses.length === 0 ? (
              <View className="p-4">
                <Text className="text-gray-500 text-center">No horses yet</Text>
              </View>
            ) : (
              horses.map((horse, index) => (
                <TouchableOpacity
                  key={horse.id}
                  className={`p-4 flex-row justify-between items-center ${
                    index < horses.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onPress={() => router.push(`/edit-horse?id=${horse.id}`)}
                >
                  <View className="flex-row items-center">
                    {/* Horse Photo or Emoji */}
                    {horse.photo_url ? (
                      <View className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                        <Image
                          source={{ uri: horse.photo_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <Text className="text-2xl mr-3">🐴</Text>
                    )}
                    <Text className="text-base font-medium">{horse.name}</Text>
                  </View>
                  <Text className="text-gray-400">→</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              className="p-4 flex-row justify-between items-center border-t border-gray-100"
              onPress={() => router.push("/add-horse")}
            >
              <Text className="text-base text-blue-500 font-semibold">
                Add New Horse
              </Text>
              <Text className="text-blue-500">+</Text>
            </TouchableOpacity>
          </View>

          {/* Customization Section */}
          <Text className="text-sm text-gray-500 uppercase font-semibold mb-3 px-2">
            Customize
          </Text>
          <View className="bg-white rounded-lg mb-6">
            <TouchableOpacity className="p-4">
              <Text className="text-base text-gray-700">Language</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4"
              onPress={() => router.push("/theme-select")}
            >
              <Text className="text-base text-gray-700">Theme</Text>
            </TouchableOpacity>
          </View>

          {/* App Info Section */}
          <Text className="text-sm text-gray-500 uppercase font-semibold mb-3 px-2">
            About
          </Text>
          <View className="bg-white rounded-lg mb-6">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-sm text-gray-500 mb-1">Version</Text>
              <Text className="text-base">1.0.0</Text>
            </View>
            <TouchableOpacity className="p-4">
              <Text className="text-base text-gray-700">Help & Support</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 py-4 rounded-lg mb-8"
          >
            <Text className="text-white text-center font-bold text-lg">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
