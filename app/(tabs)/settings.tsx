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
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../../utilities/themes";

export default function SettingsScreen() {
  const router = useRouter();
  const { horses } = useHorse();
  const { colors } = useTheme() as ExtendedTheme;
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
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View
          className="p-6 shadow-sm"
          style={{
            backgroundColor: colors.bar,
            borderColor: colors.border,
          }}
        >
          <Text className="text-3xl font-bold" style={{ color: colors.text }}>
            Settings
          </Text>
        </View>

        {/* Profile Section */}
        <View className="p-4">
          <Text
            className="text-sm uppercase font-semibold mb-3 px-2"
            style={{ color: colors.textSecondary }}
          >
            Profile
          </Text>
          <View
            className="rounded-lg mb-6"
            style={{ backgroundColor: colors.card }}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="text-sm mb-1"
                style={{ color: colors.textSecondary }}
              >
                Name
              </Text>
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                {profile?.name || "Not set"}
              </Text>
            </View>
            <View
              className="p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="text-sm mb-1"
                style={{ color: colors.textSecondary }}
              >
                Email
              </Text>
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                {profile?.email || "Not set"}
              </Text>
            </View>
            <TouchableOpacity
              className="p-4 flex-row justify-between items-center"
              onPress={() => router.push("/edit-profile")}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.primary }}
              >
                Edit Profile
              </Text>
              <Text style={{ color: colors.primary }}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Horses Section */}
          <Text
            className="text-sm uppercase font-semibold mb-3 px-2"
            style={{ color: colors.textSecondary }}
          >
            Your Horses
          </Text>
          <View
            className="rounded-lg mb-6"
            style={{ backgroundColor: colors.card }}
          >
            {horses.length === 0 ? (
              <View className="p-4">
                <Text
                  className="text-center"
                  style={{ color: colors.textSecondary }}
                >
                  No horses yet
                </Text>
              </View>
            ) : (
              horses.map((horse, index) => (
                <TouchableOpacity
                  key={horse.id}
                  className="p-4 flex-row justify-between items-center"
                  style={{
                    borderBottomWidth: index < horses.length - 1 ? 1 : 0,
                    borderColor: colors.border,
                  }}
                  onPress={() => router.push(`/edit-horse?id=${horse.id}`)}
                >
                  <View className="flex-row items-center">
                    {/* Horse Photo or Emoji */}
                    {horse.photo_url ? (
                      <View
                        className="w-10 h-10 rounded-full overflow-hidden mr-3"
                        style={{ backgroundColor: colors.border }}
                      >
                        <Image
                          source={{ uri: horse.photo_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <Text className="text-2xl mr-3">🐴</Text>
                    )}
                    <Text
                      className="text-base font-medium"
                      style={{ color: colors.text }}
                    >
                      {horse.name}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary }}>→</Text>
                </TouchableOpacity>
              ))
            )}
            {horses.length < 3 && (
              <TouchableOpacity
                className="p-4 flex-row justify-between items-center border-t"
                style={{ borderColor: colors.border }}
                onPress={() => router.push("/add-horse")}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.primary }}
                >
                  Add New Horse
                </Text>
                <Text style={{ color: colors.primary }}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Customization Section */}
          <Text
            className="text-sm uppercase font-semibold mb-3 px-2"
            style={{ color: colors.textSecondary }}
          >
            Customize
          </Text>
          <View
            className="rounded-lg mb-6"
            style={{ backgroundColor: colors.card }}
          >
            <TouchableOpacity
              className="p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-base" style={{ color: colors.text }}>
                Language
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4"
              onPress={() => router.push("/theme-select")}
            >
              <Text className="text-base" style={{ color: colors.text }}>
                Theme
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info Section */}
          <Text
            className="text-sm uppercase font-semibold mb-3 px-2"
            style={{ color: colors.textSecondary }}
          >
            About
          </Text>
          <View
            className="rounded-lg mb-6"
            style={{ backgroundColor: colors.card }}
          >
            <View
              className="p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text
                className="text-sm mb-1"
                style={{ color: colors.textSecondary }}
              >
                Version
              </Text>
              <Text className="text-base" style={{ color: colors.text }}>
                1.0.0
              </Text>
            </View>
            <TouchableOpacity className="p-4">
              <Text className="text-base" style={{ color: colors.text }}>
                Help & Support
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="py-4 rounded-lg mb-8"
            style={{ backgroundColor: "#ef7171ff" }}
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
