import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTheme } from "@react-navigation/native";
import { ExtendedTheme } from "../../utilities/themes";

export default function TabLayout() {
  const theme = useTheme() as ExtendedTheme;
  const { colors } = theme;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Tab bar background
        tabBarStyle: {
          backgroundColor: colors.bar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        // Active tab (icon + label)
        tabBarActiveTintColor: colors.primary,
        // Inactive tab (icon + label)
        tabBarInactiveTintColor: colors.textSecondary,
        // Label styling
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-activity"
        options={{
          title: "Add Activity",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="plus" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
