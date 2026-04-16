import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";

interface Activity {
  date: string;
  type: string;
  duration: number | null;
}

interface TotalStatsProps {
  activities: Activity[];
  days?: number;
}

interface RowProps {
  label: string;
  value: string | number;
  colors: ExtendedTheme["colors"];
}

export default function TotalStats({ activities, days }: TotalStatsProps) {
  const { colors } = useTheme() as ExtendedTheme;

  const getFilteredActivities = () => {
    if (!days) return activities;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return activities.filter((a) => new Date(a.date) >= cutoff);
  };

  const filtered = getFilteredActivities();

  const totalSessions = filtered.length;

  const totalTime = filtered.reduce((sum, a) => sum + (a.duration || 0), 0);

  const uniqueDays = new Set(filtered.map((a) => a.date)).size;

  const restDays = days ? days - uniqueDays : 0; // "All" → rest days doesn't really make sense

  return (
    <View>
      <Row label="Total sessions" value={totalSessions} colors={colors} />
      <Row label="Total time" value={`${totalTime} min`} colors={colors} />
      {days !== undefined && (
        <Row label="Rest days" value={restDays} colors={colors} />
      )}
    </View>
  );
}

function Row({ label, value, colors }: RowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}
