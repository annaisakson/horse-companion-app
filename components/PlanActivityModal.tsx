import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { ACTIVITY_TYPES } from "../lib/constants";

interface PlanActivityModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  horseId: string;
  onSuccess: () => void;
}

export default function PlanActivityModal({
  visible,
  onClose,
  date,
  horseId,
  onSuccess,
}: PlanActivityModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedType) {
      Alert.alert("Please select an activity type");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a planned activity (minimal info)
      const { error } = await supabase.from("activities").insert({
        horse_id: horseId,
        date: date,
        type: selectedType,
        notes: notes,
        is_planned: true, // Mark as planned
        created_by: user.id,
        // Leave duration, level, feeling as null
        duration: null,
        level: null,
        feeling: null,
      });

      if (error) throw error;

      Alert.alert("Success!", "Activity planned");

      // Reset form
      setSelectedType("");
      setNotes("");

      onSuccess(); // Refresh calendar
      onClose();
    } catch (error: any) {
      console.error("Error planning activity:", error);
      Alert.alert("Error", "Could not plan activity: " + error.message);
    } finally {
      setSaving(false);
    }
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
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          style={{ maxHeight: "80%" }}
        >
          <ScrollView>
            {/* Handle bar */}
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            <View className="p-4">
              {/* Title */}
              <Text className="text-2xl font-bold mb-2">Plan Activity</Text>
              <Text className="text-gray-600 mb-6">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>

              {/* Activity Type Selection */}
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-3">
                  Activity Type
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
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

              {/* Notes */}
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  placeholder="E.g., Competition at 3pm, bring jumping saddle..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
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
                  {saving ? "Saving..." : "Plan Activity"}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                className="py-3 rounded-lg border border-gray-300"
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
