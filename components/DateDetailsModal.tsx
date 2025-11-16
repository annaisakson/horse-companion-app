import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import {
  ACTIVITY_TYPES,
  FEELING_OPTIONS,
  SPECIAL_TYPES,
} from "../lib/constants";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Activity {
  id: string;
  horse_id: string;
  date: string;
  type: string;
  duration: number | null;
  level: number | null;
  feeling: string | null;
  notes: string;
  is_planned: boolean;
  created_at: string;
}

interface DateDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  activities: Activity[];
  onPlanActivity: () => void;
  today: string;
}

export default function DateDetailsModal({
  visible,
  onClose,
  selectedDate,
  activities,
  onPlanActivity,
  today,
}: DateDetailsModalProps) {
  const router = useRouter();
  const { colors } = useTheme() as ExtendedTheme;

  const isSelectedDateFuture = selectedDate > today;

  const renderActivityCard = (activity: Activity) => {
    const activityType =
      ACTIVITY_TYPES.find((t) => t.id === activity.type) || ACTIVITY_TYPES[7];
    const feelingEmoji = FEELING_OPTIONS.find(
      (f) => f.id === activity.feeling
    )?.emoji;

    return (
      <TouchableOpacity
        key={activity.id}
        className="rounded-lg p-3 mb-2"
        style={{ backgroundColor: colors.card }}
        onPress={() => {
          onClose();
          router.push(`/activity-details?id=${activity.id}`);
        }}
      >
        {/* Type Badge */}
        <View
          className="flex-row items-center mb-2 self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: activityType.color }}
        >
          <Text className="text-white font-semibold text-sm">
            {activityType.label}
          </Text>
          {!SPECIAL_TYPES.includes(activity.type) && activity.duration && (
            <Text className="text-white text-sm ml-2">
              • {activity.duration} min
            </Text>
          )}
          {(activityType.label === "Rest Day" ||
            activityType.label === "Injured") && (
            <Text className="text-white"> • </Text>
          )}

          {feelingEmoji && !activity.is_planned && (
            <View className="ml-1">{feelingEmoji}</View>
          )}
          {activityType.label === "Rest Day" && (
            <MaterialCommunityIcons name="sleep" size={20} color="white" />
          )}
          {activityType.label === "Injured" && (
            <Ionicons name="bandage-outline" size={20} color="white" />
          )}
        </View>

        {/* Notes preview */}
        {activity.notes && (
          <Text
            className="text-sm mb-1"
            numberOfLines={1}
            style={{ color: colors.textSecondary }}
          >
            {activity.notes}
          </Text>
        )}

        {/* Footer */}
        <View className="flex-row justify-between items-center">
          {activity.is_planned && (
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.border }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.textSecondary }}
              >
                Planned
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl"
          style={{ backgroundColor: colors.background, maxHeight: "70%" }}
        >
          <ScrollView>
            {/* Handle bar */}
            <View className="items-center pt-3 pb-2">
              <View
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
            </View>

            <View className="p-4">
              {/* Date Header */}
              <Text
                className="text-xl font-bold mb-4"
                style={{ color: colors.text }}
              >
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>

              {/* Future Date - Show Planning Option */}
              {isSelectedDateFuture && (
                <View className="mb-4">
                  <View
                    className="p-4 rounded-lg mb-3"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    <Text
                      className="font-semibold mb-1"
                      style={{ color: colors.primary }}
                    >
                      Future Date
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      You can plan activities for this date
                    </Text>
                  </View>

                  {activities.length === 0 ? (
                    <TouchableOpacity
                      className="py-4 rounded-lg"
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => {
                        onClose();
                        setTimeout(() => {
                          onPlanActivity();
                        }, 300);
                      }}
                    >
                      <Text className="text-white text-center font-bold text-lg">
                        Plan Activity
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text
                        className="text-base font-semibold mb-3"
                        style={{ color: colors.text }}
                      >
                        Planned Activities
                      </Text>
                      {activities.map((activity) =>
                        renderActivityCard(activity)
                      )}
                      <TouchableOpacity
                        className="py-3 rounded-lg mt-2"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => {
                          onClose();
                          setTimeout(() => {
                            onPlanActivity();
                          }, 300);
                        }}
                      >
                        <Text className="text-white text-center font-semibold">
                          + Plan Another Activity
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Past/Today Date - Show Completed Activities */}
              {!isSelectedDateFuture && (
                <View>
                  {activities.length === 0 ? (
                    <View>
                      <Text
                        className="text-center py-4"
                        style={{ color: colors.textSecondary }}
                      >
                        No activities on this day
                      </Text>
                      <TouchableOpacity
                        className="py-4 rounded-lg"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => {
                          onClose();
                          router.push(`/add-activity?date=${selectedDate}`);
                        }}
                      >
                        <Text className="text-white text-center font-bold text-lg">
                          Add Activity
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <Text
                        className="text-base font-semibold mb-3"
                        style={{ color: colors.text }}
                      >
                        Activities
                      </Text>
                      {activities.map((activity) =>
                        renderActivityCard(activity)
                      )}
                      <TouchableOpacity
                        className="py-3 rounded-lg mt-2"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => {
                          onClose();
                          router.push(`/add-activity?date=${selectedDate}`);
                        }}
                      >
                        <Text className="text-white text-center font-semibold">
                          + Add Another Activity
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                className="py-3 rounded-lg mt-4"
                style={{ borderWidth: 1, borderColor: colors.border }}
                onPress={onClose}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
