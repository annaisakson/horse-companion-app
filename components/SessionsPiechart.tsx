import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { ACTIVITY_TYPES } from "../lib/constants";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

interface Activity {
  type: string;
  date: string;
}

interface ActivityBreakdownChartProps {
  activities: Activity[];
}

export default function ActivityBreakdownChart({
  activities,
}: ActivityBreakdownChartProps) {
  const { colors } = useTheme() as ExtendedTheme;

  // Get activity type breakdown for last 30 days
  const getActivityTypeBreakdown = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter activities from last 30 days
    const recentActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= thirtyDaysAgo;
    });

    // Count each activity type
    const typeCounts: { [key: string]: number } = {};

    recentActivities.forEach((activity) => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });

    // Convert to chart data format
    const chartData = Object.entries(typeCounts).map(([type, count]) => {
      const activityType = ACTIVITY_TYPES.find((t) => t.id === type);
      return {
        name: activityType?.label || type,
        count: count,
        color: activityType?.color || "#3B82F6",
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    });

    return chartData;
  };

  const activityBreakdown = getActivityTypeBreakdown();

  return (
    <View
      className="p-4 rounded-lg shadow-sm mb-8"
      style={{ backgroundColor: colors.card }}
    >
      <Text
        className="text-lg font-semibold mb-3"
        style={{ color: colors.text }}
      >
        Sessions Breakdown (Last 30 Days)
      </Text>

      {activityBreakdown.length === 0 ? (
        <Text
          className="text-center py-4"
          style={{ color: colors.textSecondary }}
        >
          No activities in the last 30 days
        </Text>
      ) : (
        <View className="items-center">
          <PieChart
            data={activityBreakdown}
            width={Dimensions.get("window").width - 48}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}
    </View>
  );
}
