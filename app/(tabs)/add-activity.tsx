import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  ACTIVITY_TYPES,
  FEELING_OPTIONS,
  SPECIAL_TYPES,
} from "../../lib/constants";
import HorseSelector from "../../components/HorseSelector";
import { useHorse } from "../../lib/HorseContext";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../../utilities/themes";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { renderActivityIcon } from "../../utilities/iconHandler";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Converts a Date object to a plain "YYYY-MM-DD" string (no timezone shift).
// We use this instead of .toISOString() because toISOString() returns UTC,
// which can flip the date by one day for users west of UTC.
const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Formats a Date into a human-friendly label shown on the date button,
// e.g. "Today · Tuesday, April 1" or "Monday, March 31".
const formatDateLabel = (date: Date, today: Date): string => {
  const isToday = toLocalDateString(date) === toLocalDateString(today);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return isToday
    ? `Today · ${weekday}, ${monthDay}`
    : `${weekday}, ${monthDay}`;
};

export default function AddActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme() as ExtendedTheme;

  // Pull optional pre-filled values from navigation params.
  // The calendar screen passes `date` when the user taps a past day and
  // chooses to log an activity for that day.
  const {
    planId,
    type: prefilledType,
    notes: prefilledNotes,
    date: prefilledDate, // ← new param from calendar
  } = useLocalSearchParams<{
    planId?: string;
    type?: string;
    notes?: string;
    date?: string; // expected format: "YYYY-MM-DD"
  }>();

  // ── Date state ──────────────────────────────────────────────────────────
  // "today" is computed once on mount so we have a stable reference to cap
  // the picker and compare against.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If a date was passed in via params (from the calendar), parse and use it —
  // but still cap it at today so logging in the future is impossible here.
  const resolveInitialDate = (): Date => {
    if (prefilledDate) {
      // Parse "YYYY-MM-DD" safely in local time by splitting manually.
      const [y, m, d] = prefilledDate.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      parsed.setHours(0, 0, 0, 0);
      // Never allow a future date — if the param was somehow in the future,
      // fall back to today.
      return parsed > today ? today : parsed;
    }
    return today;
  };

  useFocusEffect(
    useCallback(() => {
      const newDate = resolveInitialDate(); // respects prefilledDate
      setActivityDate(newDate);
      setShowDatePicker(false);
    }, [prefilledDate]),
  );

  const [activityDate, setActivityDate] = useState<Date>(resolveInitialDate());
  // Controls whether the native date-picker sheet is visible.
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Activity form state ─────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<string>(prefilledType || "");
  const [notes, setNotes] = useState(decodeURIComponent(prefilledNotes || ""));
  const [duration, setDuration] = useState(30);
  const [level, setLevel] = useState(3);
  const [feeling, setFeeling] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { selectedHorseId, selectedHorse } = useHorse();

  const MAX_NOTES_LENGTH = 250;

  // whether the chosen activity type is a "special" one (Rest Day /
  // Injured), which hides the duration / level / feeling fields.
  const isSpecialType = SPECIAL_TYPES.includes(selectedType);

  const specialActivityTypes = ACTIVITY_TYPES.filter((type) =>
    SPECIAL_TYPES.includes(type.id),
  );

  const regularActivityTypes = ACTIVITY_TYPES.filter(
    (type) => !SPECIAL_TYPES.includes(type.id),
  );

  const handleSpecialTypeToggle = (typeId: string) => {
    setSelectedType(selectedType === typeId ? "" : typeId);
  };

  // Called by the native DateTimePicker when the user picks a date.
  const handleDateChange = (_event: any, selected?: Date) => {
    // On Android the picker closes itself; on iOS we close it manually below.
    setShowDatePicker(Platform.OS === "ios");

    if (!selected) return;

    selected.setHours(0, 0, 0, 0);

    // Safety guard: reject any future date the picker might allow.
    if (selected > today) {
      setActivityDate(today);
    } else {
      setActivityDate(selected);
    }
  };

  const handleSave = async () => {
    if (!selectedHorseId) {
      Alert.alert("Please select a horse");
      return;
    }

    if (!selectedType) {
      Alert.alert("Please select an activity type");
      return;
    }

    if (!isSpecialType && !feeling) {
      Alert.alert("Please select a feeling");
      return;
    }
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("You must be logged in");
        return;
      }

      const activityData: any = {
        horse_id: selectedHorseId,
        date: toLocalDateString(activityDate),
        type: selectedType,
        notes: notes,
        created_by: user.id,
      };

      if (!isSpecialType) {
        activityData.duration = duration;
        activityData.level = level;
        activityData.feeling = feeling;
      } else {
        activityData.duration = null;
        activityData.level = null;
        activityData.feeling = null;
      }

      const { error } = await supabase.from("activities").insert(activityData);

      if (error) throw error;

      Alert.alert("Success!", `Activity logged for ${selectedHorse?.name}`);

      // Reset form state
      setSelectedType("");
      setDuration(30);
      setLevel(3);
      setFeeling("");
      setNotes("");

      router.back();
    } catch (error: any) {
      console.error("Error saving activity:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      {/* Banner shown when this screen was opened from a planned activity */}
      {planId && (
        <View
          className="p-3 border-b"
          style={{
            backgroundColor: colors.secondary,
            borderColor: colors.primary,
          }}
        >
          <Text
            className="font-semibold text-center"
            style={{ color: colors.textSecondary }}
          >
            Logging planned activity
          </Text>
        </View>
      )}
      <HorseSelector />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ScrollView
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            className="text-2xl font-bold mb-6"
            style={{ color: colors.text }}
          >
            Log Activity
          </Text>
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
              <Text className="font-semibold" style={{ color: colors.text }}>
                {formatDateLabel(activityDate, today)}
              </Text>
            </View>

            {/* Chevron hint that this is tappable */}
            <Text style={{ color: colors.textSecondary }}>›</Text>
          </TouchableOpacity>

          {/* Native date picker — cant scroll past today*/}
          {showDatePicker && (
            <DateTimePicker
              value={activityDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={today} // ← blocks future dates
              onChange={handleDateChange}
            />
          )}

          {/* Special Type Checkboxes (Rest Day / Injured) */}
          <View className="mb-10">
            <View className="flex-row gap-3">
              {specialActivityTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleSpecialTypeToggle(type.id)}
                  className="flex-1 flex-row items-center rounded-lg"
                >
                  <View
                    className="w-8 h-8 rounded border-2 mr-3 items-center justify-center"
                    style={{
                      backgroundColor:
                        selectedType === type.id ? colors.card : "transparent",
                      borderColor: colors.border,
                    }}
                  >
                    {selectedType === type.id && (
                      <Text className="text-sm" style={{ color: colors.text }}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-lg mr-2"
                    style={{ color: colors.textSecondary, fontSize: 24 }}
                  >
                    {renderActivityIcon(type.icon, 32)}
                  </Text>
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

          {/* Regular Activity Type Selection */}
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
              className="flex-row"
              scrollEnabled={!isSpecialType}
            >
              {regularActivityTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => !isSpecialType && setSelectedType(type.id)}
                  disabled={isSpecialType}
                  className="mr-3 px-4 py-3 rounded-lg items-center justify-center w-[92px]"
                  style={{
                    backgroundColor:
                      selectedType === type.id
                        ? colors.primary
                        : colors.secondary,
                  }}
                >
                  <Text className="text-2xl mb-1">
                    {renderActivityIcon(type.icon, 48)}
                  </Text>
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: selectedType === type.id ? "#FFFFFF" : colors.text,
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
            className={`mb-6 p-4 rounded-lg ${
              isSpecialType ? "opacity-40" : ""
            }`}
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
              minimumTrackTintColor={colors.secondary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              disabled={isSpecialType}
              style={{ height: 40 }} // Makes the slider track area larger
            />
            <View className="flex-row justify-between">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                15 min
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                2 hrs
              </Text>
            </View>
          </View>

          {/* Exertion Level Slider */}
          <View
            className={`mb-6 p-4 rounded-lg ${
              isSpecialType ? "opacity-40" : ""
            }`}
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
              minimumTrackTintColor={colors.secondary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              disabled={isSpecialType}
              style={{ height: 40 }}
            />
            <View className="flex-row justify-between">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Light
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
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
                  className="items-center p-3 rounded-lg w-[62px]"
                  style={{
                    backgroundColor:
                      feeling === option.id ? colors.secondary : colors.card,
                  }}
                >
                  <View className="mb-1">
                    <Text style={{ color: colors.text, fontSize: 24 }}>
                      {option.emoji}
                    </Text>
                  </View>
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

          {/* Notes - Always enabled with character counter */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.text }}
              >
                Notes (Optional)
              </Text>
              <Text
                className="text-xs"
                style={{
                  color:
                    notes.length > MAX_NOTES_LENGTH
                      ? "#EF4444"
                      : colors.textSecondary,
                }}
              >
                {notes.length}/{MAX_NOTES_LENGTH}
              </Text>
            </View>
            <TextInput
              placeholder={
                isSpecialType
                  ? "Add any notes..."
                  : "Add any notes about the session..."
              }
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
            disabled={loading}
            className="py-4 rounded-lg"
            style={{
              backgroundColor: loading ? colors.border : colors.primary,
            }}
          >
            <Text className="text-white text-center font-bold text-lg">
              {loading ? "Saving..." : "Save Activity"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
