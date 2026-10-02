import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import Colors from "../../theme/colors";

interface Props {
  title: string;
  loading?: boolean;
  onPress: () => void;
}

export default function CustomButton({
  title,
  loading = false,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        loading && styles.disabled,
      ]}
      activeOpacity={0.85}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator
          color={Colors.white}
        />
      ) : (
        <Text style={styles.text}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  disabled: {
    opacity: 0.7,
  },

  text: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 18,
  },
});