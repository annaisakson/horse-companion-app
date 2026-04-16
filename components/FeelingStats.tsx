import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import { FEELING_OPTIONS, SPECIAL_TYPES } from "../lib/constants";

interface Activity {
  id: string;
  date: string;
  type: string;
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
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return activities.filter((a) => a.date >= cutoffStr);
}

export default function FeelingStats({ activities, days }: Props) {
  const { colors } = useTheme() as ExtendedTheme;

  const relevant = filterByDays(activities, days).filter(
    (a) => !SPECIAL_TYPES.includes(a.type) && a.feeling,
  );

  if (relevant.length === 0) {
    return (
      <View className="items-center py-4">
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No feeling data for this period
        </Text>
      </View>
    );
  }

  const counts: Record<string, number> = {};
  relevant.forEach((a) => {
    counts[a.feeling] = (counts[a.feeling] ?? 0) + 1;
  });

  const total = relevant.length;

  // Build ranked list using FEELING_OPTIONS order for stable sort
  const ranked = FEELING_OPTIONS.map((opt) => ({
    id: opt.id,
    emoji: opt.emoji,
    label: opt.label,
    count: counts[opt.id] ?? 0,
    pct: Math.round(((counts[opt.id] ?? 0) / total) * 100),
  }))
    .filter((o) => o.count > 0)
    .sort((a, b) => b.count - a.count);

  const topFeeling = ranked[0];
  const maxCount = Math.max(...ranked.map((r) => r.count), 1);

  return (
    <View>
      {/* Hero: most-used feeling */}
      <View
        style={{
          backgroundColor: colors.secondary,
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          alignItems: "center", // centers the whole block
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Most used
        </Text>
        <View
          style={{
            width: "75%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 40 }}>{topFeeling.emoji}</Text>
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
            {topFeeling.label}
          </Text>
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {topFeeling.pct}% of sessions
        </Text>
      </View>

      {/* Full breakdown */}
      <View style={{ gap: 8 }}>
        {ranked.map((item) => (
          <View
            key={item.id}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Text style={{ fontSize: 20, width: 28, textAlign: "center" }}>
              {item.emoji}
            </Text>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontWeight: "500",
                  }}
                >
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {item.count}× · {item.pct}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 6,
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: colors.primary,
                    borderRadius: 3,
                    opacity: 0.7 + 0.3 * (item.count / maxCount),
                  }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
