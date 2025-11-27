import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@src/theme/ThemeProvider";
import { Plus } from "lucide-react-native";

interface FabButtonProps {
  onPress: () => void;
  icon?: any;          // lucide icon component
  style?: ViewStyle;   // extra styling if needed
}

export default function FabButton({ onPress, icon: Icon = Plus, style }: FabButtonProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.fab,
        { backgroundColor: theme.primary },
        style
      ]}
    >
      <Icon size={26} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
