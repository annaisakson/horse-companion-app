import {
  TextInput,
  View,
  Button,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert("Missing information");
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.log("Sign up error:", JSON.stringify(error, null, 2));
          throw error;
        }

        const user = data.user;
        if (user) {
          // Manually create the profile (since trigger is disabled)
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              name: name,
            });

          // Ignore duplicate key errors (happens on email confirmation)
          if (insertError && insertError.code !== "23505") {
            console.log(
              "Profile insert error:",
              JSON.stringify(insertError, null, 2)
            );
            throw insertError;
          }

          if (insertError) {
            console.log(
              "Profile insert error:",
              JSON.stringify(insertError, null, 2)
            );
            throw insertError;
          }
        }

        Alert.alert(
          "Sign up successful, please check your email for the verification link"
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.log("Full error object:", error);
      Alert.alert("Auth error", error.message);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-6">
        {isSignUp ? "Create an Account" : "Welcome Back"}
      </Text>

      {isSignUp && (
        <TextInput
          placeholder="Full Name"
          className="w-full border p-2 mb-3 rounded"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        placeholder="Email"
        className="w-full border p-2 mb-3 rounded"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        className="w-full border p-2 mb-4 rounded"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={isSignUp ? "Sign Up" : "Log In"} onPress={handleAuth} />

      <View className="h-4" />

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text className="text-blue-600">
          {isSignUp
            ? "Already have an account? Log in"
            : "Don’t have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
