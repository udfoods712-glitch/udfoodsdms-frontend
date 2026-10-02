import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
  },

  logoSection: {
    alignItems: "center",
    marginTop: 60,
  },

  logo: {
    width: 170,
    height: 170,
    marginBottom: 20,
  },

  title: {
    fontSize: Typography.heading,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: Typography.body,
    color: Colors.secondaryText,
    marginTop: 8,
  },

  form: {
    marginTop: 60,
  },

});

export default styles;