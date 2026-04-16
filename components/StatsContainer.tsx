import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import ExertionChart from "./ExertionChart";
import DurationChart from "./DurationChart";
import FeelingStats from "./FeelingStats";
import TotalStats from "./TotalStats";
import SessionsPiechart from "./SessionsPiechart";

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
}

type Range = { label: string; days: number | undefined };

const RANGES: Range[] = [
  { label: "30d", days: 30 },
  { label: "6mo", days: 180 },
  { label: "All", days: undefined },
];

interface StatCardProps {
  title: string;
  children: React.ReactNode;
  colors: any;
}

function StatCard({ title, children, colors }: StatCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 14,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function StatsContainer({ activities }: Props) {
  const { colors } = useTheme() as ExtendedTheme;
  const [selectedRange, setSelectedRange] = useState<Range>(RANGES[0]);

  return (
    <View>
      {/* Time range pill selector */}
      <View className="flex flex-row justify-between items-center">
        <Text
          className="text-lg font-semibold mb-3"
          style={{ color: colors.text }}
        >
          Statistics
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            marginBottom: 16,
            alignSelf: "flex-end",
          }}
        >
          {RANGES.map((range) => {
            const active = range.label === selectedRange.label;
            return (
              <TouchableOpacity
                key={range.label}
                onPress={() => setSelectedRange(range)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? colors.primary : colors.card,
                  borderWidth: 0.5,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: active ? "#FFFFFF" : colors.textSecondary,
                  }}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Total chart */}
      <StatCard title="Totals" colors={colors}>
        <TotalStats activities={activities} days={selectedRange.days} />
      </StatCard>

      {/* Pie chart */}
      <StatCard title="Session types" colors={colors}>
        <SessionsPiechart activities={activities} days={selectedRange.days} />
      </StatCard>

      {/* Exertion chart */}
      <StatCard title="Exertion levels" colors={colors}>
        <ExertionChart activities={activities} days={selectedRange.days} />
      </StatCard>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <StatCard title="Avg. duration by type" colors={colors}>
            <DurationChart activities={activities} days={selectedRange.days} />
          </StatCard>
        </View>

        <View style={{ flex: 1 }}>
          <StatCard title="Overall feeling" colors={colors}>
            <FeelingStats activities={activities} days={selectedRange.days} />
          </StatCard>
        </View>
      </View>
    </View>
  );
}
