import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { ACTIVITY_TYPES } from "../lib/constants";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

interface Activity {
  type: string;
  date: string;
}

interface Props {
  activities: Activity[];
  days?: number;
}

export default function SessionsPiechart({ activities, days }: Props) {
  const { colors } = useTheme() as ExtendedTheme;

  const getFilteredActivities = () => {
    if (!days) return activities;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return activities.filter((a) => new Date(a.date) >= cutoff);
  };

  const filtered = getFilteredActivities();

  const typeCounts: Record<string, number> = {};

  filtered.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  const data = Object.entries(typeCounts).map(([type, count]) => {
    const t = ACTIVITY_TYPES.find((x) => x.id === type);

    return {
      name: t?.label || type,
      count,
      color: t?.color || "#3B82F6",
      legendFontColor: colors.text,
      legendFontSize: 12,
    };
  });

  if (data.length === 0) {
    return (
      <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
        No data
      </Text>
    );
  }

  return (
    <View style={{ alignItems: "center" }}>
      <PieChart
        data={data}
        width={Dimensions.get("window").width - 50}
        height={220}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        chartConfig={{
          color: () => colors.text,
        }}
      />
    </View>
  );
}
