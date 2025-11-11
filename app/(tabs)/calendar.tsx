import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useHorse } from "../../lib/HorseContext";
import HorseSelector from "../../components/HorseSelector";
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
  duration: number | null;
  level: number | null;
  feeling: string | null;
  notes: string;
  is_planned: boolean;
  created_at: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedHorseId, selectedHorse } = useHorse();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Fetch all activities for the selected horse
  const fetchActivities = async () => {
    if (!selectedHorseId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("horse_id", selectedHorseId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching activities:", error);
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  };

  // Refresh when screen comes into focus or horse changes
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [selectedHorseId])
  );

  // Handle date press on calendar
  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setShowBottomSheet(true);
  };

  // Get activities for a specific date
  const getActivitiesForDate = (dateStr: string) => {
    return activities.filter((activity) => activity.date === dateStr);
  };

  // Create marked dates object for the calendar
  // This shows dots on dates that have activities
  const getMarkedDates = () => {
    const marked: any = {};

    // Mark dates with activities
    activities.forEach((activity) => {
      const color =
        ACTIVITY_TYPES.find((t) => t.id === activity.type)?.color || "#3B82F6";

      if (!marked[activity.date]) {
        marked[activity.date] = {
          dots: [],
          selected: activity.date === selectedDate,
        };
      }

      // Add a dot for this activity (max 3 dots per day)
      if (marked[activity.date].dots.length < 3) {
        marked[activity.date].dots.push({
          color: activity.is_planned ? "#9CA3AF" : color, // Gray for planned, activity color for completed
        });
      }
    });

    // Highlight selected date
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        dots: [],
      };
    } else if (selectedDate) {
      marked[selectedDate].selected = true;
    }

    return marked;
  };

  const selectedDateActivities = getActivitiesForDate(selectedDate);
  const isSelectedDateFuture = selectedDate > today;
  const isSelectedDateToday = selectedDate === today;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <HorseSelector />

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold mb-4">Calendar</Text>

          {/* Calendar Component */}
          <Calendar
            current={today}
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            firstDay={1}
            theme={{
              todayTextColor: "#3B82F6",
              selectedDayBackgroundColor: "#3B82F6",
              dotColor: "#3B82F6",
              arrowColor: "#3B82F6",
            }}
          />

          <View className="mt-4 p-4 bg-white rounded-lg">
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <Text className="text-sm text-gray-600">Completed activity</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-gray-400 mr-2" />
              <Text className="text-sm text-gray-600">Planned activity</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet for Selected Date */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowBottomSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{ maxHeight: "70%" }}
          >
            <ScrollView>
              {/* Handle bar */}
              <View className="items-center pt-3 pb-2">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              <View className="p-4">
                {/* Date Header */}
                <Text className="text-xl font-bold mb-4">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>

                {/* Future Date - Show Planning Option */}
                {isSelectedDateFuture && (
                  <View className="mb-4">
                    <View className="bg-blue-50 p-4 rounded-lg mb-3">
                      <Text className="text-blue-800 font-semibold mb-1">
                        Future Date
                      </Text>
                      <Text className="text-blue-600 text-sm">
                        You can plan activities for this date
                      </Text>
                    </View>

                    {selectedDateActivities.length === 0 ? (
                      <TouchableOpacity
                        className="bg-blue-500 py-4 rounded-lg"
                        onPress={() => {
                          setShowBottomSheet(false);
                          router.push(
                            `/add-activity?date=${selectedDate}&isPlanned=true`
                          );
                        }}
                      >
                        <Text className="text-white text-center font-bold text-lg">
                          Plan Activity
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        <Text className="text-base font-semibold mb-3">
                          Planned Activities
                        </Text>
                        {selectedDateActivities.map((activity) =>
                          renderActivityCard(activity)
                        )}
                        <TouchableOpacity
                          className="bg-blue-500 py-3 rounded-lg mt-2"
                          onPress={() => {
                            setShowBottomSheet(false);
                            router.push(
                              `/add-activity?date=${selectedDate}&isPlanned=true`
                            );
                          }}
                        >
                          <Text className="text-white text-center font-semibold">
                            + Plan Another Activity
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Past/Today Date - Show Completed Activities */}
                {!isSelectedDateFuture && (
                  <View>
                    {selectedDateActivities.length === 0 ? (
                      <View>
                        <Text className="text-gray-500 text-center py-4">
                          No activities on this day
                        </Text>
                        <TouchableOpacity
                          className="bg-blue-500 py-4 rounded-lg"
                          onPress={() => {
                            setShowBottomSheet(false);
                            router.push(`/add-activity?date=${selectedDate}`);
                          }}
                        >
                          <Text className="text-white text-center font-bold text-lg">
                            Add Activity
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-base font-semibold mb-3">
                          Activities
                        </Text>
                        {selectedDateActivities.map((activity) =>
                          renderActivityCard(activity)
                        )}
                        <TouchableOpacity
                          className="bg-blue-500 py-3 rounded-lg mt-2"
                          onPress={() => {
                            setShowBottomSheet(false);
                            router.push(`/add-activity?date=${selectedDate}`);
                          }}
                        >
                          <Text className="text-white text-center font-semibold">
                            + Add Another Activity
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  className="py-3 rounded-lg mt-4 border border-gray-300"
                  onPress={() => setShowBottomSheet(false)}
                >
                  <Text className="text-gray-700 text-center font-semibold">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );

  // Helper function to render activity cards
  function renderActivityCard(activity: Activity) {
    const activityType =
      ACTIVITY_TYPES.find((t) => t.id === activity.type) || ACTIVITY_TYPES[7];
    const feelingEmoji = FEELING_OPTIONS.find(
      (f) => f.id === activity.feeling
    )?.emoji;

    return (
      <TouchableOpacity
        key={activity.id}
        className="bg-gray-50 rounded-lg p-3 mb-2"
        onPress={() => {
          setShowBottomSheet(false);
          router.push(`/activity-details?id=${activity.id}`);
        }}
      >
        {/* Type Badge */}
        <View
          className="flex-row items-center mb-2 self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: activityType.color }}
        >
          <Text className="text-white font-semibold text-sm">
            {activityType.label}
          </Text>
          {!SPECIAL_TYPES.includes(activity.type) && activity.duration && (
            <Text className="text-white text-sm ml-2">
              • {activity.duration} min
            </Text>
          )}
        </View>

        {/* Notes preview */}
        {activity.notes && (
          <Text className="text-gray-700 text-sm mb-1" numberOfLines={1}>
            {activity.notes}
          </Text>
        )}

        {/* Footer with feeling */}
        <View className="flex-row justify-between items-center">
          {activity.is_planned && (
            <View className="bg-gray-200 px-2 py-1 rounded">
              <Text className="text-gray-600 text-xs font-semibold">
                Planned
              </Text>
            </View>
          )}
          {feelingEmoji && !activity.is_planned && (
            <Text className="text-lg">{feelingEmoji}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
}
