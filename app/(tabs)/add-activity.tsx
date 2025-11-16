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

// needs to get the selected horse id from the homescreen
// needs to post the activity to the api and fill the table in supabase

const {
  planId,
  type: prefilledType,
  notes: prefilledNotes,
} = useLocalSearchParams<{
  planId?: string;
  type?: string;
  notes?: string;
}>();

export default function AddActivityScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>(prefilledType || "");
  const [notes, setNotes] = useState(decodeURIComponent(prefilledNotes || ""));
  const [duration, setDuration] = useState(30); // minutes
  const [level, setLevel] = useState(3);
  const [feeling, setFeeling] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { selectedHorseId, selectedHorse } = useHorse();

  // Check if a special type (rest/injured) is selected
  const isSpecialType = SPECIAL_TYPES.includes(selectedType);

  // Get the special activity types for checkboxes
  const specialActivityTypes = ACTIVITY_TYPES.filter((type) =>
    SPECIAL_TYPES.includes(type.id)
  );

  // Get regular activity types (excluding special ones)
  const regularActivityTypes = ACTIVITY_TYPES.filter(
    (type) => !SPECIAL_TYPES.includes(type.id)
  );

  const handleSpecialTypeToggle = (typeId: string) => {
    // Toggle: if already selected, deselect; otherwise select
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

    // For special types, we don't need duration/level/feeling
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

      // Only add duration/level/feeling if NOT a special type
      if (!isSpecialType) {
        activityData.duration = duration;
        activityData.level = level;
        activityData.feeling = feeling;
      } else {
        // For special types, set defaults or null
        activityData.duration = null;
        activityData.level = null;
        activityData.feeling = null;
      }

      const { error } = await supabase.from("activities").insert(activityData);

      if (error) throw error;

      Alert.alert("Success!", `Activity logged for ${selectedHorse?.name}`);

      // Reset form
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {planId && (
        <View className="bg-blue-50 p-3 border-b border-blue-200">
          <Text className="text-blue-900 font-semibold text-center">
            📅 Logging planned activity
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
          <Text className="text-2xl font-bold mb-6">Log Activity</Text>

          {/* Special Type Checkboxes (Rest Day / Injured) */}
          <View className="mb-10">
            <View className="flex-row gap-3">
              {specialActivityTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleSpecialTypeToggle(type.id)}
                  className="flex-1 flex-row items-center rounded-lg "
                >
                  <View
                    className={`w-8 h-8 rounded border-2 mr-3 items-center justify-center ${
                      selectedType === type.id
                        ? "bg-white border-gray-300"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedType === type.id && (
                      <Text className="text-sm">✓</Text>
                    )}
                  </View>
                  <Text className="text-lg mr-2">{type.icon}</Text>
                  <Text
                    className={`font-semibold text-gray-700 ${
                      selectedType === type.id
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Regular Activity Type Selection */}
          <View className={`mb-6 ${isSpecialType ? "opacity-40" : ""}`}>
            <Text className="text-lg font-semibold mb-3">Activity Type</Text>
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
                  className={`mr-3 px-4 py-3 rounded-lg items-center justify-center min-w-[80px] ${
                    selectedType === type.id ? "bg-blue-500" : "bg-white"
                  }`}
                >
                  <Text className="text-2xl mb-1">{type.icon}</Text>
                  <Text
                    className={`text-xs font-medium ${
                      selectedType === type.id ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Duration Slider */}
          <View
            className={`mb-6 bg-white p-4 rounded-lg ${
              isSpecialType ? "opacity-40" : ""
            }`}
          >
            <Text className="text-lg font-semibold mb-2">
              Duration: {duration} min
            </Text>
            <Slider
              minimumValue={15}
              maximumValue={120}
              step={5}
              value={duration}
              onValueChange={setDuration}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#E5E7EB"
              disabled={isSpecialType}
            />
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">15 min</Text>
              <Text className="text-xs text-gray-500">2 hrs</Text>
            </View>
          </View>

          {/* Exertion Level Slider */}
          <View
            className={`mb-6 bg-white p-4 rounded-lg ${
              isSpecialType ? "opacity-40" : ""
            }`}
          >
            <Text className="text-lg font-semibold mb-2">
              Exertion Level: {level}
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={level}
              onValueChange={setLevel}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#E5E7EB"
              disabled={isSpecialType}
            />
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Light</Text>
              <Text className="text-xs text-gray-500">Intense</Text>
            </View>
          </View>

          {/* Feeling Selection */}
          <View className={`mb-6 ${isSpecialType ? "opacity-40" : ""}`}>
            <Text className="text-lg font-semibold mb-3">Overall Feeling</Text>
            <View className="flex-row justify-between">
              {FEELING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => !isSpecialType && setFeeling(option.id)}
                  disabled={isSpecialType}
                  className={`items-center p-3 rounded-lg ${
                    feeling === option.id ? "bg-blue-100" : "bg-white"
                  }`}
                >
                  <Text className="text-3xl mb-1">{option.emoji}</Text>
                  <Text className="text-xs text-gray-600">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes - Always enabled */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2">Notes (Optional)</Text>
            <TextInput
              placeholder={
                isSpecialType
                  ? "Add any notes..."
                  : "Add any notes about the session..."
              }
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              className="bg-white p-3 rounded-lg border border-gray-200"
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`py-4 rounded-lg ${
              loading ? "bg-gray-400" : "bg-blue-500"
            }`}
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
