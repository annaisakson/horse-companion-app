import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

interface Activity {
  date: string;
  type: string;
  duration: number | null;
}

interface Last30DaysStatsProps {
  activities: Activity[];
}

export default function Last30DaysStats({ activities }: Last30DaysStatsProps) {
  const { colors } = useTheme() as ExtendedTheme;

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

    const datesWithActivities = new Set(
      recentActivities.map((activity) => activity.date)
    );

    const explicitRestDays = recentActivities.filter(
      (activity) => activity.type === "rest"
    ).length;

    const daysWithNoActivity = 30 - datesWithActivities.size;
    const restDays = explicitRestDays + daysWithNoActivity;

    return { totalSessions, totalTime, restDays };
  };

  const stats = getLast30DaysStats();

  return (
    <View
      className="p-4 rounded-lg shadow-sm mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <Text
        className="text-lg font-semibold mb-3"
        style={{ color: colors.text }}
      >
        Last 30 Days
      </Text>
      <View className="flex-row justify-between py-2 border-b border-gray-100">
        <Text style={{ color: colors.textSecondary }}>Total sessions</Text>
        <Text className="font-semibold" style={{ color: colors.text }}>
          {stats.totalSessions}
        </Text>
      </View>
      <View className="flex-row justify-between py-2 border-b border-gray-100">
        <Text style={{ color: colors.textSecondary }}>Total time</Text>
        <Text className="font-semibold" style={{ color: colors.text }}>
          {stats.totalTime} min
        </Text>
      </View>
      <View className="flex-row justify-between py-2">
        <Text style={{ color: colors.textSecondary }}>Rest days</Text>
        <Text className="font-semibold" style={{ color: colors.text }}>
          {stats.restDays}
        </Text>
      </View>
    </View>
  );
}
