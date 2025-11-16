import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { supabase } from "../../lib/supabase";
import { useHorse } from "../../lib/HorseContext";
import HorseSelector from "../../components/HorseSelector";
import { ACTIVITY_TYPES } from "../../lib/constants";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import PlanActivityModal from "../../components/PlanActivityModal";
import DateDetailsModal from "../../components/DateDetailsModal";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../../utilities/themes";

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
  const { selectedHorseId } = useHorse();
  const { colors } = useTheme() as ExtendedTheme;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];

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

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [selectedHorseId])
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setShowBottomSheet(true);
  };

  const getActivitiesForDate = (dateStr: string) => {
    return activities.filter((activity) => activity.date === dateStr);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    activities.forEach((activity) => {
      const color =
        ACTIVITY_TYPES.find((t) => t.id === activity.type)?.color ||
        colors.primary;

      if (!marked[activity.date]) {
        marked[activity.date] = {
          dots: [],
          selected: activity.date === selectedDate,
        };
      }

      if (marked[activity.date].dots.length < 3) {
        marked[activity.date].dots.push({
          color: activity.is_planned ? colors.textSecondary : color,
        });
      }
    });

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

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <HorseSelector />

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text
            className="text-2xl font-bold mb-4"
            style={{ color: colors.text }}
          >
            Calendar
          </Text>

          {/* Calendar Component */}
          <Calendar
            current={today}
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            firstDay={1}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textSecondary,
              dotColor: colors.primary,
              selectedDotColor: "#FFFFFF",
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "500",
            }}
          />

          {/* Legend */}
          <View
            className="mt-4 p-4 rounded-lg"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center mb-1">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors.primary }}
              />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Completed activity
              </Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors.textSecondary }}
              />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Planned activity
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Details Modal */}
      <DateDetailsModal
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        selectedDate={selectedDate}
        activities={selectedDateActivities}
        onPlanActivity={() => setShowPlanModal(true)}
        today={today}
      />

      {/* Plan Activity Modal */}
      <PlanActivityModal
        visible={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        date={selectedDate}
        horseId={selectedHorseId || ""}
        onSuccess={() => {
          fetchActivities();
        }}
      />
    </SafeAreaView>
  );
}
