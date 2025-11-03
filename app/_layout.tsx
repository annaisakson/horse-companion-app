import "../global.css";
import { Slot, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { ActivityIndicator, View } from "react-native";
import { HorseProvider } from "../lib/HorseContext";

// TODO:
// if restday, disable other choices except notes
// update page when changing horse
// click activity to go to go to edit page
// add picture to horse
// add proper safety to passwords/names/etc
// overall styling

export default function RootLayout() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session once on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    initAuth();

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Redirects happen outside the effect
  useEffect(() => {
    if (!loading) {
      if (session) router.replace("/");
      else router.replace("/login");
    }
  }, [loading, session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0070f3" />
      </View>
    );
  }

  return (
    <HorseProvider>
      <Slot />
    </HorseProvider>
  );
}
