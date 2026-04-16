import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import { ACTIVITY_TYPES, SPECIAL_TYPES } from "../lib/constants";

interface Activity {
  id: string;
  date: string;
  type: string;
  duration: number;
  level: number;
  feeling: string;
}

interface Props {
  activities: Activity[];
  days?: number;
}

function filterByDays(activities: Activity[], days?: number): Activity[] {
  if (!days) return activities;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return activities.filter((a) => new Date(a.date) >= cutoff);
}

export default function DurationChart({ activities, days }: Props) {
  const { colors } = useTheme() as ExtendedTheme;

  const relevant = filterByDays(activities, days).filter(
    (a) => !SPECIAL_TYPES.includes(a.type) && a.duration != null,
  );

  if (relevant.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No session data for this period
        </Text>
      </View>
    );
  }

  // Aggregate average duration per type
  const typeTotals: Record<string, { sum: number; count: number }> = {};

  relevant.forEach((a) => {
    if (!typeTotals[a.type]) {
      typeTotals[a.type] = { sum: 0, count: 0 };
    }
    typeTotals[a.type].sum += a.duration;
    typeTotals[a.type].count += 1;
  });

  const typeData = Object.entries(typeTotals)
    .map(([typeId, { sum, count }]) => {
      const typeDef = ACTIVITY_TYPES.find((t) => t.id === typeId);

      return {
        typeId,
        label: typeDef?.label ?? typeId,
        avg: Math.round(sum / count),
        color: typeDef?.color ?? "#94a3b8",
      };
    })
    .sort((a, b) => b.avg - a.avg);

  const max = typeData[0].avg;

  return (
    <View style={{ gap: 12 }}>
      {typeData.map((d) => {
        const widthPercent = (d.avg / max) * 100;

        return (
          <View key={d.typeId}>
            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: colors.text,
                  fontWeight: "500",
                }}
                numberOfLines={1}
              >
                {d.label}
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: colors.text,
                  fontWeight: "600",
                }}
              >
                {d.avg} min
              </Text>
            </View>

            {/* Bar (no background track) */}
            <View
              style={{
                height: 6,
                width: `${widthPercent}%`,
                backgroundColor: d.color,
                borderRadius: 4,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
