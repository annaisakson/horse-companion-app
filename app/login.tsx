import {
  TextInput,
  View,
  Button,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useState } from "react";
import { useAppTheme } from "../hooks/useAppTheme";

// --- Validation rules ---
const NAME_REGEX = /^[a-zA-Z\s'-]{2,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

interface ValidateFieldsParams {
  name: string;
  email: string;
  password: string;
  isSignUp: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validateFields({
  name,
  email,
  password,
  isSignUp,
}: ValidateFieldsParams) {
  const errors: FormErrors = {};

  if (isSignUp) {
    if (!name.trim()) {
      errors.name = "Name is required.";
    } else if (!NAME_REGEX.test(name)) {
      errors.name =
        "Name must be 2–20 characters. Only letters, spaces, hyphens and apostrophes allowed.";
    }
  }

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (isSignUp) {
    if (password.length < PASSWORD_MIN) {
      errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain at least one number.";
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.password = "Password must contain at least one special character.";
    }
  }

  return errors;
}

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { colors } = useAppTheme();

  const inputStyle = {
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  };

  // --- Clear a field's error as the user types ---
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Password reset ---
  const handleForgotPassword = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setErrors({
        email: "Enter a valid email above to receive a reset link.",
      });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "horseapp://reset-password",
      });
      if (error) throw error;
      Alert.alert("Check your email", "A password reset link has been sent.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  // --- Sign up / log in ---
  const handleAuth = async () => {
    const validationErrors = validateFields({
      name,
      email,
      password,
      isSignUp,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const user = data.user;
        if (user) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({ id: user.id, email: user.email, name: name.trim() });

          if (insertError && insertError.code !== "23505") throw insertError;
        }

        Alert.alert(
          "Almost there!",
          "Check your email for a verification link.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <Text
        className="text-2xl font-bold mb-6"
        style={{ color: colors.primary }}
      >
        {isSignUp ? "Create an Account" : "Welcome Back"}
      </Text>

      {/* Name */}
      {isSignUp && (
        <View className="w-full mb-3">
          <TextInput
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
            className="w-full p-2 rounded"
            value={name}
            onChangeText={(v) => {
              setName(v);
              clearError("name");
            }}
            style={inputStyle}
          />
          {errors.name && (
            <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
          )}
        </View>
      )}

      {/* Email */}
      <View className="w-full mb-3">
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          className="w-full p-2 rounded"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearError("email");
          }}
          style={inputStyle}
        />
        {errors.email && (
          <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
        )}
      </View>

      {/* Password */}
      <View className="w-full mb-1">
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          className="w-full p-2 rounded"
          secureTextEntry
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clearError("password");
          }}
          style={inputStyle}
        />
        {errors.password && (
          <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
        )}
      </View>

      {/* Forgot password — only shown on login */}
      {!isSignUp && (
        <TouchableOpacity
          onPress={handleForgotPassword}
          className="w-full mb-4"
        >
          <Text
            className="text-right text-sm"
            style={{ color: colors.primary }}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>
      )}

      <View className="h-4" />

      {/* Submit */}
      <TouchableOpacity
        onPress={handleAuth}
        className="py-2 px-3 rounded-lg items-center w-full"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="font-bold text-lg text-white">
          {isSignUp ? "Sign Up" : "Log In"}
        </Text>
      </TouchableOpacity>

      <View className="h-4" />

      {/* Toggle sign up / log in */}
      <TouchableOpacity
        onPress={() => {
          setIsSignUp(!isSignUp);
          setErrors({});
        }}
      >
        <Text style={{ color: colors.primary }}>
          {isSignUp
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
