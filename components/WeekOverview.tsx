import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

interface Activity {
  date: string;
  type: string;
}

interface WeekOverviewProps {
  activities: Activity[];
  getActivityType: (typeId: string) => { color: string };
}

export default function WeekOverview({
  activities,
  getActivityType,
}: WeekOverviewProps) {
  const { colors } = useTheme() as ExtendedTheme;

  // Get this week's dates (Mon-Sun)
  const getThisWeek = () => {
    const week = [];
    const now = new Date();
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);

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

  // Get activities for a specific date (up to 3)
  const getActivitiesForDate = (dateStr: string) => {
    return activities
      .filter((activity) => activity.date === dateStr)
      .slice(0, 3)
      .map((activity) => getActivityType(activity.type).color);
  };

  const thisWeek = getThisWeek();

  return (
    <View className="px-4 pb-4">
      <View className="flex-row justify-between">
        {thisWeek.map((day, index) => {
          const dayActivities = getActivitiesForDate(day.date);

          return (
            <View
              key={index}
              style={{
                backgroundColor: day.isToday ? colors.primary : colors.card,
              }}
              className="items-center p-3 rounded-lg"
            >
              <Text
                className="text-xs font-medium mb-1"
                style={{
                  color: day.isToday ? "#fff" : colors.textSecondary,
                }}
              >
                {day.dayName}
              </Text>
              <Text
                className="text-base font-bold"
                style={{
                  color: day.isToday ? "#fff" : colors.textSecondary,
                }}
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
  );
}
