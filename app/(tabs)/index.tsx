import { useEffect, useState } from "react";
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
import {
  ACTIVITY_TYPES,
  FEELING_OPTIONS,
  SPECIAL_TYPES,
} from "../../lib/constants";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

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

  useEffect(() => {
    if (selectedHorseId) {
      fetchActivities();
    }
  }, [selectedHorseId]);

  useFocusEffect(
    useCallback(() => {
      // This runs every time the screen comes into focus
      const refresh = async () => {
        await refreshHorses(); // Refresh the horse list
        if (selectedHorseId) {
          await fetchActivities(); // Refresh activities for selected horse
        }
      };
      refresh();
    }, [selectedHorseId]) // Re-run if selected horse changes
  );

  const fetchActivities = async () => {
    if (!selectedHorseId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("horse_id", selectedHorseId)
      .order("date", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  };

  // Get activity type details
  const getActivityType = (typeId: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === typeId) || ACTIVITY_TYPES[6];
  };

  // Get feeling emoji
  const getFeelingEmoji = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.emoji || "";
  };

  // Get current day and date
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
  });

  // Get this week's dates (Mon-Sun)
  const getThisWeek = () => {
    const week = [];
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust when Sunday

    // Get Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);

    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      week.push({
        date: day.toISOString().split("T")[0],
        dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: day.getDate(),
        isToday: day.toDateString() === now.toDateString(),
      });
    }
    return week;
  };

  const thisWeek = getThisWeek();

  // Get activities for a specific date (up to 3) - NEW
  const getActivitiesForDate = (dateStr: string) => {
    return activities
      .filter((activity) => activity.date === dateStr)
      .slice(0, 3)
      .map((activity) => getActivityType(activity.type).color);
  };

  // Calculate stats for last 30 days
  const getLast30DaysStats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= thirtyDaysAgo;
    });

    const totalSessions = recentActivities.length;
    const totalTime = recentActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0
    );

    // Get all unique dates with activities
    const datesWithActivities = new Set(
      recentActivities.map((activity) => activity.date)
    );

    // Count rest days: days with explicit "rest" type OR days with no activity
    const explicitRestDays = recentActivities.filter(
      (activity) => activity.type === "rest"
    ).length;

    const daysWithNoActivity = 30 - datesWithActivities.size;

    // Total rest = explicit rest days + days with no activity at all
    const restDays = explicitRestDays + daysWithNoActivity;

    return { totalSessions, totalTime, restDays };
  };

  const stats = getLast30DaysStats();

  // Get only the 5 most recent activities
  const recentActivities = activities.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0070f3" />
      </SafeAreaView>
    );
  }

  if (horses.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-xl mb-4">No horses yet!</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => router.push("/add-horse")}
        >
          <Text className="text-white font-bold">Add Your First Horse</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1">
        <HorseSelector />

        {/* Current Day */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold">
            {dayName}, {dateStr}
          </Text>
        </View>

        {/* This Week Overview */}
        <View className="px-4 pb-4">
          <View className="flex-row justify-between">
            {thisWeek.map((day, index) => {
              const dayActivities = getActivitiesForDate(day.date);

              return (
                <View
                  key={index}
                  className={`items-center p-3 rounded-lg ${
                    day.isToday ? "bg-blue-500" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium mb-1 ${
                      day.isToday ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    className={`text-base font-bold ${
                      day.isToday ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {day.dayNum}
                  </Text>

                  {/* Activity dots (up to 3) */}
                  {dayActivities.length > 0 && (
                    <View className="flex-row mt-1 gap-0.5">
                      {dayActivities.map((color, i) => (
                        <View
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {selectedHorse && (
          <View className="px-4">
            {/* Recent Activities Section */}
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-3">
                Recent Activities
              </Text>

              {recentActivities.length === 0 ? (
                <View className="bg-white p-4 rounded-lg shadow-sm">
                  <Text className="text-gray-500 text-center py-4">
                    No activities yet for {selectedHorse.name}
                  </Text>
                  <TouchableOpacity
                    className="bg-blue-500 py-3 rounded-lg mt-2"
                    onPress={() => router.push("/add-activity")}
                  >
                    <Text className="text-white text-center font-semibold">
                      Add First Activity
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                recentActivities.map((activity) => {
                  const activityType = getActivityType(activity.type);
                  const feelingEmoji = getFeelingEmoji(activity.feeling);

                  return (
                    <TouchableOpacity
                      key={activity.id}
                      className="bg-white rounded-2xl shadow-sm mb-3 p-4"
                      onPress={() =>
                        router.push(`/activity-details?id=${activity.id}`)
                      }
                    >
                      {/* Type and Duration Badge */}
                      <View
                        className="flex-row items-center mb-2 self-start px-3 py-2 rounded-2xl"
                        style={{ backgroundColor: activityType.color }}
                      >
                        <Text className="text-white font-semibold">
                          {activityType.label}
                        </Text>
                        {!SPECIAL_TYPES.includes(activity.type) && (
                          <Text className="text-white ml-2">
                            • {activity.duration} min
                          </Text>
                        )}
                      </View>

                      {/* Notes (truncated) */}
                      {activity.notes && (
                        <Text className="text-gray-700 mb-2" numberOfLines={2}>
                          {activity.notes}
                        </Text>
                      )}

                      {/* Date and Feeling */}
                      <View className="flex-row justify-between items-center">
                        <Text className="text-sm text-gray-500">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="text-xl">{feelingEmoji}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Last 30 Days Stats */}
            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <Text className="text-lg font-semibold mb-3">Last 30 Days</Text>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Total sessions</Text>
                <Text className="font-semibold">{stats.totalSessions}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Total time</Text>
                <Text className="font-semibold">{stats.totalTime} min</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Rest days</Text>
                <Text className="font-semibold">{stats.restDays}</Text>
              </View>
            </View>

            {/* Quick Stats placeholder */}
            <View className="bg-white p-4 rounded-lg shadow-sm mb-8">
              <Text className="text-lg font-semibold mb-3">
                Activity Breakdown
              </Text>
              <Text className="text-gray-500 text-center py-4">
                Charts coming soon...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
