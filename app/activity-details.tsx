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
    // Set form state from activity
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
    fetchActivity(); // Refresh data
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
      ]
    );
  };

  const getActivityType = (typeId: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === typeId) || ACTIVITY_TYPES[7];
  };

  const getFeelingEmoji = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.emoji || "";
  };

  const getFeeling = (feelingId: string) => {
    return FEELING_OPTIONS.find((f) => f.id === feelingId)?.label || "";
  };

  const isSpecialType = SPECIAL_TYPES.includes(selectedType);
  const specialActivityTypes = ACTIVITY_TYPES.filter((type) =>
    SPECIAL_TYPES.includes(type.id)
  );
  const regularActivityTypes = ACTIVITY_TYPES.filter(
    (type) => !SPECIAL_TYPES.includes(type.id)
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0070f3" />
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Activity not found</Text>
      </SafeAreaView>
    );
  }

  const activityType = getActivityType(activity.type);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
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
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 text-lg">← Back</Text>
            </TouchableOpacity>

            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text className="text-blue-500 text-lg font-semibold">
                  Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text className="text-gray-500 text-lg">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="p-4">
            {/* Date Header */}
            <View className="mb-6">
              <Text className="text-xl font-bold mb-2">
                {new Date(activity.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>

            {isEditing ? (
              // EDIT MODE
              <>
                {/* Special Type Checkboxes */}
                <View className="mb-10">
                  <View className="flex-row gap-3">
                    {specialActivityTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() =>
                          setSelectedType(
                            selectedType === type.id ? "" : type.id
                          )
                        }
                        className="flex-1 flex-row items-center rounded-lg"
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
                          className={`font-semibold ${
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

                {/* Activity Type Selection */}
                <View className={`mb-6 ${isSpecialType ? "opacity-40" : ""}`}>
                  <Text className="text-lg font-semibold mb-3">
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
                        className={`mr-3 px-4 py-3 rounded-lg items-center justify-center min-w-[80px] ${
                          selectedType === type.id ? "bg-blue-500" : "bg-white"
                        }`}
                      >
                        <Text className="text-2xl mb-1">{type.icon}</Text>
                        <Text
                          className={`text-xs font-medium ${
                            selectedType === type.id
                              ? "text-white"
                              : "text-gray-700"
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

                {/* Level Slider */}
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
                  <Text className="text-lg font-semibold mb-3">
                    Overall Feeling
                  </Text>
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
                        <Text className="text-xs text-gray-600">
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold mb-2">Notes</Text>
                  <TextInput
                    placeholder="Add any notes..."
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
                  disabled={saving}
                  className={`py-4 rounded-lg mb-3 ${
                    saving ? "bg-gray-400" : "bg-blue-500"
                  }`}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={handleDelete}
                  className="py-4 rounded-lg bg-red-700"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Delete Activity
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
                  <View className="bg-white p-4 rounded-lg mb-4">
                    <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                      <Text className="text-gray-600">Duration</Text>
                      <Text className="font-semibold text-lg">
                        {activity.duration} minutes
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                      <Text className="text-gray-600">Exertion Level</Text>
                      <Text className="font-semibold text-lg">
                        {activity.level}/5
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600">Feeling</Text>
                      <View className="flex flex-row justify-between items-center gap-2">
                        <Text className="text-xl">
                          {getFeeling(activity.feeling || "")}
                        </Text>
                        <Text className="text-3xl">
                          {getFeelingEmoji(activity.feeling || "")}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {activity.notes && (
                  <View className="bg-white p-4 rounded-lg mb-4">
                    <Text className="text-gray-600 font-semibold mb-2">
                      Notes
                    </Text>
                    <Text className="text-gray-800">{activity.notes}</Text>
                  </View>
                )}

                {/* Delete Button (View Mode) */}
                <TouchableOpacity
                  onPress={handleDelete}
                  className="py-4 rounded-lg bg-red-700 mt-4"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Delete Activity
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
