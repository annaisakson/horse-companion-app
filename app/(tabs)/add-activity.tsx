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

export default function AddActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme() as ExtendedTheme;

  const {
    planId,
    type: prefilledType,
    notes: prefilledNotes,
  } = useLocalSearchParams<{
    planId?: string;
    type?: string;
    notes?: string;
  }>();

  const [selectedType, setSelectedType] = useState<string>(prefilledType || "");
  const [notes, setNotes] = useState(decodeURIComponent(prefilledNotes || ""));
  const [duration, setDuration] = useState(30);
  const [level, setLevel] = useState(3);
  const [feeling, setFeeling] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { selectedHorseId, selectedHorse } = useHorse();

  const MAX_NOTES_LENGTH = 250;

  const isSpecialType = SPECIAL_TYPES.includes(selectedType);

  const specialActivityTypes = ACTIVITY_TYPES.filter((type) =>
    SPECIAL_TYPES.includes(type.id)
  );

  const regularActivityTypes = ACTIVITY_TYPES.filter(
    (type) => !SPECIAL_TYPES.includes(type.id)
  );

  const handleSpecialTypeToggle = (typeId: string) => {
    setSelectedType(selectedType === typeId ? "" : typeId);
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
      Alert.alert("Please select how you're feeling");
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
        date: new Date().toISOString().split("T")[0],
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
                    {type.icon}
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
                      selectedType === type.id ? colors.primary : colors.card,
                  }}
                >
                  <Text className="text-2xl mb-1">{type.icon}</Text>
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
