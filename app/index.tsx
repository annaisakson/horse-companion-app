import { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Homescreen() {
  const router = useRouter();
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const fetchHorses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("owner_id", user.id);

      if (error) console.error(error);
      else setHorses(data || []);

      setLoading(false);

      // If no horses exist → go to add-horse screen
      if (!data || data.length === 0) {
        router.replace("/add-horse");
      }
    };

    fetchHorses();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0070f3" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold mb-4">Your Horses</Text>
      {horses.map((horse) => (
        <Text key={horse.id} className="text-lg">
          🐴 {horse.name}
        </Text>
      ))}

      <View className="mt-4">
        <Button
          title="Add New Horse"
          onPress={() => router.push("/add-horse")}
        />
      </View>
      <Button title="Log out" onPress={handleLogout} />
    </View>
  );
}
