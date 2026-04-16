import { View, Text, Dimensions } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import { SPECIAL_TYPES } from "../lib/constants";

interface Activity {
  id: string;
  date: string;
  type: string;
  duration: number;
  level: number;
  feeling: string;
  notes: string;
}

interface Props {
  activities: Activity[];
  days?: number; // 30, 180, or undefined (all time)
}

const SCREEN_WIDTH = Dimensions.get("window").width;
// Padding: 16px on each side (px-4), plus the card's inner padding
const CHART_WIDTH = SCREEN_WIDTH - 32 - 32; // screen padding + card padding
const BAR_HEIGHT = 80;
const LEVEL_COLORS = ["#86efac", "#4ade80", "#facc15", "#fb923c", "#f87171"];

function filterByDays(activities: Activity[], days?: number): Activity[] {
  if (!days) return activities;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return activities.filter((a) => a.date >= cutoffStr);
}

export default function ExertionChart({ activities, days }: Props) {
  const { colors } = useTheme() as ExtendedTheme;

  const relevant = filterByDays(activities, days).filter(
    (a) => !SPECIAL_TYPES.includes(a.type) && a.level != null,
  );

  if (relevant.length === 0) {
    return (
      <View className="items-center py-4">
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No session data for this period
        </Text>
      </View>
    );
  }

  // Count how many sessions are at each level (1–5)
  const counts = [0, 0, 0, 0, 0];
  relevant.forEach((a) => {
    if (a.level >= 1 && a.level <= 5) counts[a.level - 1]++;
  });
  const max = Math.max(...counts, 1);

  const labels = ["Light", "Easy", "Moderate", "Hard", "Intense"];
  const barWidth = CHART_WIDTH / 5 - 8; // 40px for y-axis, 8px gap

  return (
    <View>
      {/* Bars */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: BAR_HEIGHT + 28,
        }}
      >
        {/* Bars */}
        {counts.map((count, i) => {
          const barH = max > 0 ? (count / max) * BAR_HEIGHT : 0;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                alignItems: "center",
                marginHorizontal: 3,
              }}
            >
              {/* Count label above bar */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: count > 0 ? colors.text : "transparent",
                  marginBottom: 2,
                  height: 16,
                }}
              >
                {count}
              </Text>
              {/* The bar itself */}
              <View
                style={{
                  width: "100%",
                  height: Math.max(barH, count > 0 ? 4 : 0),
                  backgroundColor: count > 0 ? LEVEL_COLORS[i] : colors.border,
                  borderRadius: 4,
                  opacity: count > 0 ? 1 : 0.35,
                }}
              />
              {/* Baseline */}
              <View
                style={{
                  width: "100%",
                  height: 1,
                  backgroundColor: colors.border,
                  marginTop: 0,
                }}
              />
              {/* X label */}
              <Text
                style={{
                  fontSize: 10,
                  color: colors.textSecondary,
                  marginTop: 4,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
