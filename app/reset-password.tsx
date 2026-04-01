import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";

const PASSWORD_MIN = 8;

function validatePassword(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN)
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number.";
  if (!/[^a-zA-Z0-9]/.test(password))
    return "Password must contain at least one special character.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();

  const inputStyle = {
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  };

  const handleReset = async () => {
    const validationError = validatePassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Supabase session is automatically set when the deep link is opened
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert(
        "Password updated!",
        "You can now log in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: colors.primary }}
      >
        Reset Password
      </Text>
      <Text className="text-sm mb-6 text-center" style={{ color: colors.text }}>
        Enter a new password for your account.
      </Text>

      {/* New password */}
      <View className="w-full mb-3">
        <TextInput
          placeholder="New Password"
          placeholderTextColor={colors.text + "80"}
          className="w-full p-2 rounded"
          secureTextEntry
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          style={inputStyle}
        />
      </View>

      {/* Confirm password */}
      <View className="w-full mb-1">
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor={colors.text + "80"}
          className="w-full p-2 rounded"
          secureTextEntry
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            setError(null);
          }}
          style={inputStyle}
        />
        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>

      <View className="h-4" />

      <TouchableOpacity
        onPress={handleReset}
        disabled={loading}
        className="py-2 px-3 rounded-lg items-center w-full"
        style={{ backgroundColor: loading ? colors.border : colors.primary }}
      >
        <Text className="font-bold text-lg text-white">
          {loading ? "Updating..." : "Set New Password"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
