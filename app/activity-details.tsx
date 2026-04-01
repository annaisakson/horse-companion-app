import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import {
  ACTIVITY_TYPES,
  FEELING_OPTIONS,
  SPECIAL_TYPES,
} from "../lib/constants";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../utilities/themes";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Activity {
  id: string;
  horse_id: string;
  date: string;
  type: string;
  duration: number | null;
  level: number | null;
  feeling: string | null;
  notes: string;
  created_by: string;
  created_at: string;
}

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme() as ExtendedTheme;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<string>("");
  const [duration, setDuration] = useState(30);
  const [level, setLevel] = useState(3);
  const [feeling, setFeeling] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Date picker state
  const [activityDate, setActivityDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateChange = (_event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (!selected) return;

    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      setActivityDate(today);
    } else {
      setActivityDate(selected);
    }
  };

  const MAX_NOTES_LENGTH = 250;

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching activity:", error);
      Alert.alert("Error", "Could not load activity");
      router.back();
      return;
    }

    setActivity(data);
    const parsedDate = new Date(data.date);
    parsedDate.setHours(0, 0, 0, 0);
    setActivityDate(parsedDate);
    setSelectedType(data.type);
    setDuration(data.duration || 30);
    setLevel(data.level || 3);
    setFeeling(data.feeling || "");
    setNotes(data.notes || "");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!activity) return;

    setSaving(true);

    const isSpecialType = SPECIAL_TYPES.includes(selectedType);

    const updateData: any = {
      type: selectedType,
      notes: notes,
      date: toLocalDateString(activityDate),
    };

    if (!isSpecialType) {
      updateData.duration = duration;
      updateData.level = level;
      updateData.feeling = feeling;
    } else {
      updateData.duration = null;
      updateData.level = null;
      updateData.feeling = null;
    }

    const { error } = await supabase
      .from("activities")
      .update(updateData)
      .eq("id", activity.id);

    if (error) {
      console.error("Error updating activity:", error);
      Alert.alert("Error", "Could not update activity");
      setSaving(false);
      return;
    }

    Alert.alert("Success!", "Activity updated");
    setIsEditing(false);
    fetchActivity();
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!activity) return;

            const { error } = await supabase
              .from("activities")
              .delete()
              .eq("id", activity.id);

            if (error) {
              console.error("Error deleting activity:", error);
              Alert.alert("Error", "Could not delete activity");
              return;
            }

            Alert.alert("Deleted", "Activity has been deleted");
            router.back();
          },
        },
      ],
    );
  };

  const getActivityType = (typeId: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === typeId) || ACTIVITY_TYPES[7];
  };

  const getFeelingEmoji = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.emoji;
  };

  const getFeeling = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.label || "";
  };

  const isSpecialType = SPECIAL_TYPES.includes(selectedType);
  const specialActivityTypes = ACTIVITY_TYPES.filter((type) =>
    SPECIAL_TYPES.includes(type.id),
  );
  const regularActivityTypes = ACTIVITY_TYPES.filter(
    (type) => !SPECIAL_TYPES.includes(type.id),
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Activity not found</Text>
      </SafeAreaView>
    );
  }

  const activityType = getActivityType(activity.type);

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between p-4 border-b"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-lg" style={{ color: colors.primary }}>
                ← Back
              </Text>
            </TouchableOpacity>

            {!isEditing ? (
              <TouchableOpacity onPress={handleDelete} className="p-2">
                <Text className="text-md" style={{ color: "#ef7171ff" }}>
                  Delete
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text
                  className="text-lg"
                  style={{ color: colors.textSecondary }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="p-4">
            {/* Date Header */}
            {!isEditing && (
              <View className="mb-6">
                <Text
                  className="text-xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {new Date(activity.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}

            {/* // ── EDITING MODE ────────────────────────────────────────────────────────── */}
            {isEditing ? (
              <>
                {/* Date picker */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center mb-6 px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-xs font-medium mb-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      Activity date
                    </Text>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {activityDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>

                  <Text style={{ color: colors.textSecondary }}>›</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={activityDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    maximumDate={today}
                    onChange={handleDateChange}
                  />
                )}

                {/* Special Type Checkboxes */}
                <View className="mb-10">
                  <View className="flex-row gap-3">
                    {specialActivityTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() =>
                          setSelectedType(
                            selectedType === type.id ? "" : type.id,
                          )
                        }
                        className="flex-1 flex-row items-center rounded-lg"
                      >
                        <View
                          className="w-8 h-8 rounded border-2 mr-3 items-center justify-center"
                          style={{
                            backgroundColor:
                              selectedType === type.id
                                ? colors.card
                                : "transparent",
                            borderColor: colors.border,
                          }}
                        >
                          {selectedType === type.id && (
                            <Text
                              className="text-sm"
                              style={{ color: colors.text }}
                            >
                              ✓
                            </Text>
                          )}
                        </View>
                        <Text className="text-lg mr-2">{type.icon}</Text>
                        <Text
                          className="font-semibold"
                          style={{
                            color:
                              selectedType === type.id
                                ? colors.text
                                : colors.textSecondary,
                          }}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Activity Type Selection */}
                <View className={`mb-6 ${isSpecialType ? "opacity-40" : ""}`}>
                  <Text
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Activity Type
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={!isSpecialType}
                  >
                    {regularActivityTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() =>
                          !isSpecialType && setSelectedType(type.id)
                        }
                        disabled={isSpecialType}
                        className="mr-3 px-4 py-3 rounded-lg items-center justify-center min-w-[80px]"
                        style={{
                          backgroundColor:
                            selectedType === type.id
                              ? colors.primary
                              : colors.card,
                        }}
                      >
                        <Text className="text-2xl mb-1">{type.icon}</Text>
                        <Text
                          className="text-xs font-medium"
                          style={{
                            color:
                              selectedType === type.id
                                ? "#FFFFFF"
                                : colors.text,
                          }}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Duration Slider */}
                <View
                  className={`mb-6 p-4 rounded-lg ${isSpecialType ? "opacity-40" : ""}`}
                  style={{ backgroundColor: colors.card }}
                >
                  <Text
                    className="text-lg font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Duration: {duration} min
                  </Text>
                  <Slider
                    minimumValue={15}
                    maximumValue={120}
                    step={5}
                    value={duration}
                    onValueChange={setDuration}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                    disabled={isSpecialType}
                    style={{ height: 40 }}
                  />
                  <View className="flex-row justify-between">
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      15 min
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      2 hrs
                    </Text>
                  </View>
                </View>

                {/* Level Slider */}
                <View
                  className={`mb-6 p-4 rounded-lg ${isSpecialType ? "opacity-40" : ""}`}
                  style={{ backgroundColor: colors.card }}
                >
                  <Text
                    className="text-lg font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Exertion Level: {level}
                  </Text>
                  <Slider
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={level}
                    onValueChange={setLevel}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                    disabled={isSpecialType}
                    style={{ height: 40 }}
                  />
                  <View className="flex-row justify-between">
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Light
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Intense
                    </Text>
                  </View>
                </View>

                {/* Feeling Selection */}
                <View className={`mb-6 ${isSpecialType ? "opacity-40" : ""}`}>
                  <Text
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.text }}
                  >
                    Overall Feeling
                  </Text>
                  <View className="flex-row justify-between">
                    {FEELING_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => !isSpecialType && setFeeling(option.id)}
                        disabled={isSpecialType}
                        className="items-center p-3 rounded-lg"
                        style={{
                          backgroundColor:
                            feeling === option.id
                              ? colors.secondary
                              : colors.card,
                        }}
                      >
                        <View className="mb-1">{option.emoji}</View>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View className="mb-6">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      className="text-lg font-semibold"
                      style={{ color: colors.text }}
                    >
                      Notes
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        color:
                          notes.length > MAX_NOTES_LENGTH
                            ? "#ef7171ff"
                            : colors.textSecondary,
                      }}
                    >
                      {notes.length}/{MAX_NOTES_LENGTH}
                    </Text>
                  </View>
                  <TextInput
                    placeholder="Add any notes..."
                    placeholderTextColor={colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    maxLength={MAX_NOTES_LENGTH}
                    multiline
                    numberOfLines={6}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                      minHeight: 120,
                      textAlignVertical: "top",
                    }}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="py-4 rounded-lg mb-3"
                  style={{
                    backgroundColor: saving ? colors.border : colors.primary,
                  }}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // VIEW MODE
              <>
                {/* Activity Type Badge */}
                <View
                  className="flex-row items-center mb-6 self-start px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: activityType.color }}
                >
                  <Text className="text-white text-xl mr-2">
                    {activityType.icon}
                  </Text>
                  <Text className="text-white font-bold text-lg">
                    {activityType.label}
                  </Text>
                </View>

                {/* Details Card */}
                {!SPECIAL_TYPES.includes(activity.type) && (
                  <View
                    className="p-4 rounded-lg mb-4"
                    style={{ backgroundColor: colors.card }}
                  >
                    <View
                      className="flex-row justify-between items-center mb-3 pb-3 border-b"
                      style={{ borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.textSecondary }}>
                        Duration
                      </Text>
                      <Text
                        className="font-semibold text-lg"
                        style={{ color: colors.text }}
                      >
                        {activity.duration} minutes
                      </Text>
                    </View>
                    <View
                      className="flex-row justify-between items-center mb-3 pb-3 border-b"
                      style={{ borderColor: colors.border }}
                    >
                      <Text style={{ color: colors.textSecondary }}>
                        Exertion Level
                      </Text>
                      <Text
                        className="font-semibold text-lg"
                        style={{ color: colors.text }}
                      >
                        {activity.level}/5
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text style={{ color: colors.textSecondary }}>
                        Feeling
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-xl"
                          style={{ color: colors.text }}
                        >
                          {getFeeling(activity.feeling || "")}
                        </Text>
                        <View className="text-3xl">
                          {getFeelingEmoji(activity.feeling || "")}
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {activity.notes && (
                  <View
                    className="p-4 rounded-lg mb-4"
                    style={{ backgroundColor: colors.card }}
                  >
                    <Text
                      className="font-semibold mb-2"
                      style={{ color: colors.textSecondary }}
                    >
                      Notes
                    </Text>
                    <Text style={{ color: colors.text }}>{activity.notes}</Text>
                  </View>
                )}

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="py-4 rounded-lg mt-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Edit Activity
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
