import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

export const ACTIVITY_TYPES = [
  { id: "dressage", label: "Dressage", icon: "🎯", color: "#ef7474ff" },
  { id: "jumping", label: "Jumping", icon: "🏇", color: "#78a9d9ff" },
  { id: "groundwork", label: "Groundwork", icon: "🤝", color: "#a197cd" },
  { id: "lunging", label: "Lunging", icon: "🔄", color: "#dfa6cf" },
  { id: "hacking", label: "Hacking", icon: "🌲", color: "#7baf63ff" },
  {
    id: "rest",
    label: "Rest Day",
    icon: <MaterialCommunityIcons name="sleep" size={20} />,
    color: "#e3c558ff",
  },
  {
    id: "injured",
    label: "Injured",
    icon: <Ionicons name="bandage-outline" size={20} />,
    color: "#7c7c7cff",
  },
  { id: "other", label: "Other", icon: "✨", color: "#FCB53B" },
];

export const FEELING_OPTIONS = [
  {
    id: "terrible",
    label: "Terrible",
    emoji: <FontAwesome6 name="face-flushed" size={20} />,
  },
  {
    id: "poor",
    label: "Poor",
    emoji: <FontAwesome6 name="face-grimace" size={20} />,
  },
  {
    id: "okay",
    label: "Okay",
    emoji: <FontAwesome6 name="face-smile" size={20} />,
  },
  {
    id: "good",
    label: "Good",
    emoji: <FontAwesome6 name="face-laugh-beam" size={20} />,
  },
  {
    id: "great",
    label: "Great",
    emoji: <FontAwesome6 name="face-grin-stars" size={20} />,
  },
];

export const SPECIAL_TYPES = ["rest", "injured"];
