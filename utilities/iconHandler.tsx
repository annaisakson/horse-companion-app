import React from "react";
import { Image } from "react-native";

// Renders an activity icon from ACTIVITY_TYPES.
// If the icon is a require() number (local image), renders it as <Image>.
// If it's JSX (Expo icon for rest/injured), renders it as-is.
export const renderActivityIcon = (
  icon: ReturnType<typeof require> | React.ReactNode,
  size = 32,
) => {
  if (typeof icon === "number") {
    return (
      <Image
        source={icon}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  return icon as React.ReactNode;
};
