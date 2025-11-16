import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import { SPECIAL_TYPES } from "../lib/constants";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Activity {
  id: string;
  date: string;
  type: string;
  duration: number;
  feeling: string;
  notes: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
  horseName: string;
  getActivityType: (typeId: string) => { label: string; color: string };
  getFeelingEmoji: (feelingId: string) => React.JSX.Element | null;
}

export default function RecentActivities({
  activities,
  horseName,
  getActivityType,
  getFeelingEmoji,
}: RecentActivitiesProps) {
  const router = useRouter();
  const { colors } = useTheme() as ExtendedTheme;

  return (
    <View className="mb-4">
      <Text
        className="text-lg font-semibold mb-3"
        style={{ color: colors.text }}
      >
        Recent Activities
      </Text>

      {activities.length === 0 ? (
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-center py-4" style={{ color: colors.text }}>
            No activities yet for {horseName}
          </Text>
          <TouchableOpacity
            className="py-3 rounded-lg mt-2"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push("/add-activity")}
          >
            <Text className="text-white text-center font-semibold">
              Add First Activity
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        activities.map((activity) => {
          const activityType = getActivityType(activity.type);
          const feelingEmoji = getFeelingEmoji(activity.feeling);

          return (
            <TouchableOpacity
              key={activity.id}
              className="rounded-2xl shadow-sm mb-3 p-4"
              style={{ backgroundColor: colors.card }}
              onPress={() => router.push(`/activity-details?id=${activity.id}`)}
            >
              {/* Type and Duration Badge */}
              <View
                className="flex-row items-center mb-2 self-start px-3 py-2 rounded-2xl"
                style={{ backgroundColor: activityType.color }}
              >
                <Text className="text-white font-semibold">
                  {activityType.label}
                </Text>
                {!SPECIAL_TYPES.includes(activity.type) && (
                  <Text className="text-white ml-2">
                    • {activity.duration} min
                  </Text>
                )}
                <Text className="text-white"> • </Text>
                {feelingEmoji}
                {activityType.label === "Rest Day" && (
                  <MaterialCommunityIcons
                    name="sleep"
                    size={20}
                    color="white"
                  />
                )}
                {activityType.label === "Injured" && (
                  <Ionicons name="bandage-outline" size={20} color="white" />
                )}
              </View>

              {/* Notes (truncated) */}
              {activity.notes && (
                <Text
                  className="mb-2"
                  numberOfLines={2}
                  style={{ color: colors.textSecondary }}
                >
                  {activity.notes}
                </Text>
              )}

              {/* Date */}
              <View className="flex-row justify-between items-center">
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {new Date(activity.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
