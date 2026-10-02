import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Colors from "../../theme/colors";

interface Props extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export default function CustomInput({
  icon,
  isPassword = false,
  ...props
}: Props) {

  const [hidden, setHidden] = useState(isPassword);

  return (
    <View style={styles.container}>

      <Ionicons
        name={icon}
        size={22}
        color={Colors.primary}
      />

      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.placeholder}
        secureTextEntry={hidden}
        {...props}
      />

      {isPassword && (
        <TouchableOpacity
          onPress={() => setHidden(!hidden)}
        >
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={Colors.secondaryText}
          />
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: Colors.white,

    borderWidth: 1,

    borderColor: Colors.border,

    borderRadius: 16,

    height: 60,

    paddingHorizontal: 18,

    marginBottom: 18,
  },

  input: {

    flex: 1,

    marginLeft: 12,

    fontSize: 16,

    color: Colors.text,
  },

});