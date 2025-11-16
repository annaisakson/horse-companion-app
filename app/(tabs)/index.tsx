import { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useHorse } from "../../lib/HorseContext";
import HorseSelector from "../../components/HorseSelector";
import { supabase } from "../../lib/supabase";
import { ACTIVITY_TYPES, FEELING_OPTIONS } from "../../lib/constants";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../../utilities/themes";
import WeekOverview from "../../components/WeekOverview";
import RecentActivities from "../../components/RecentActivities";
import Last30DaysStats from "../../components/Last30DaysStats";
import ActivityBreakdownChart from "../../components/SessionsPiechart";

interface Activity {
  id: string;
  horse_id: string;
  date: string;
  type: string;
  duration: number;
  level: number;
  feeling: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export default function Homescreen() {
  const router = useRouter();
  const { horses, selectedHorse, selectedHorseId, refreshHorses } = useHorse();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const { colors } = useTheme() as ExtendedTheme;
  const [todaysPlans, setTodaysPlans] = useState<Activity[]>([]);

  useEffect(() => {
    if (selectedHorseId) {
      fetchActivities();
    }
  }, [selectedHorseId]);

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        await refreshHorses();
        if (selectedHorseId) {
          await fetchActivities();
        }
      };
      refresh();
    }, [selectedHorseId])
  );

  const fetchActivities = async () => {
    if (!selectedHorseId) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("horse_id", selectedHorseId)
      .eq("is_planned", false)
      .order("date", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setActivities(data || []);
    }

    // Fetch today's planned activities
    const { data: plannedData, error: plannedError } = await supabase
      .from("activities")
      .select("*")
      .eq("horse_id", selectedHorseId)
      .eq("is_planned", true)
      .eq("date", today);

    if (plannedError) {
      console.error(plannedError);
    } else {
      setTodaysPlans(plannedData || []);
    }

    setLoading(false);
  };

  // Get activity type details
  const getActivityType = (typeId: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === typeId) || ACTIVITY_TYPES[6];
  };

  // Get feeling emoji
  const getFeelingEmoji = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.emoji || null;
  };

  // Get current day and date
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
  });

  // Get only the 5 most recent activities
  const recentActivities = activities.slice(0, 5);

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

  if (horses.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <Text className="text-xl mb-4" style={{ color: colors.text }}>
          No horses yet!
        </Text>
        <TouchableOpacity
          className="px-6 py-3 rounded-lg"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/add-horse")}
        >
          <Text className="text-white font-bold">Add Your First Horse</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView className="flex-1">
        <HorseSelector />

        {/* Current Day */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {dayName}, {dateStr}
          </Text>
        </View>

        {/* This Week Overview */}
        <WeekOverview
          activities={activities}
          getActivityType={getActivityType}
        />

        {/* Today's Planned Activities */}
        {todaysPlans.length > 0 && (
          <View className="px-4 pb-4">
            <View className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
              <Text className="text-blue-900 font-bold text-lg mb-2">
                📅 Today's Plan
              </Text>
              {todaysPlans.map((plan) => {
                const activityType = getActivityType(plan.type);
                return (
                  <TouchableOpacity
                    key={plan.id}
                    className="bg-white p-3 rounded-lg mb-2"
                    onPress={() => {
                      router.push(
                        `/add-activity?planId=${plan.id}&type=${plan.type}&notes=${encodeURIComponent(plan.notes || "")}`
                      );
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-2xl mr-3">
                          {activityType.icon}
                        </Text>
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-900">
                            {activityType.label}
                          </Text>
                          {plan.notes && (
                            <Text
                              className="text-sm text-gray-600"
                              numberOfLines={1}
                            >
                              {plan.notes}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View className="bg-blue-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">
                          Log It →
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* All Stats Sections */}
        {selectedHorse && (
          <View className="px-4">
            <RecentActivities
              activities={recentActivities}
              horseName={selectedHorse.name}
              getActivityType={getActivityType}
              getFeelingEmoji={getFeelingEmoji}
            />

            <Last30DaysStats activities={activities} />

            <ActivityBreakdownChart activities={activities} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
