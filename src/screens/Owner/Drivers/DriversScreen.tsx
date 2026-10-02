import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import api from "../../../services/api";
import { getToken } from "../../../services/auth";

interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicle_number: string;
  is_active: boolean;
}

export default function DriversScreen({
  navigation,
}: any) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrivers = async () => {
    try {
      const token = await getToken();

      const response = await api.get(
        "/users/drivers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDrivers(response.data);
    } catch (error: any) {
      console.log(
        "DRIVERS ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to load drivers",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrivers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const disableDriver = async (driver: Driver) => {
    Alert.alert(
      "Disable Driver",
      `Are you sure you want to disable ${driver.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();

              await api.patch(
                `/users/drivers/${driver.id}/disable`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              await fetchDrivers();

              Alert.alert(
                "Driver Disabled",
                `${driver.name} has been disabled.`
              );
            } catch (error: any) {
              Alert.alert(
                "Unable to disable driver",
                error.response?.data?.detail ??
                  "Something went wrong."
              );
            }
          },
        },
      ]
    );
  };

  const renderDriver = ({
    item,
  }: {
    item: Driver;
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text style={styles.phone}>
              {item.phone}
            </Text>

            <Text style={styles.vehicle}>
              {item.vehicle_number}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.is_active
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                item.is_active
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                item.is_active
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {item.is_active
                ? "Active"
                : "Inactive"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate(
                "EditDriver",
                {
                  driver: item,
                }
              )
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color="#6C4AB6"
            />

            <Text style={styles.editText}>
              Edit
            </Text>
          </TouchableOpacity>

          {item.is_active && (
            <TouchableOpacity
              style={styles.disableButton}
              onPress={() =>
                disableDriver(item)
              }
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color="#D64545"
              />

              <Text style={styles.disableText}>
                Disable
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#6C4AB6"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={drivers}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={renderDriver}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C4AB6"
          />
        }
        contentContainerStyle={
          drivers.length === 0
            ? styles.emptyContent
            : styles.content
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Drivers
              </Text>

              <Text style={styles.subtitle}>
                Manage your delivery drivers
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate(
                  "AddDriver"
                )
              }
            >
              <Ionicons
                name="add"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={38}
                color="#6C4AB6"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No drivers yet
            </Text>

            <Text style={styles.emptyText}>
              Add your first driver to start
              assigning deliveries.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() =>
                navigation.navigate(
                  "AddDriver"
                )
              }
            >
              <Text style={styles.emptyButtonText}>
                Add Driver
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FA",
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  emptyContent: {
    flexGrow: 1,
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#6C4AB6",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  phone: {
    fontSize: 13,
    color: "#777777",
    marginTop: 3,
  },

  vehicle: {
    fontSize: 12,
    color: "#999999",
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#EAF7EF",
  },

  inactiveBadge: {
    backgroundColor: "#FDEEEE",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: "#2E9D5B",
  },

  inactiveDot: {
    backgroundColor: "#D64545",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  activeText: {
    color: "#2E9D5B",
  },

  inactiveText: {
    color: "#D64545",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: 14,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  editButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEE8F8",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    color: "#6C4AB6",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  disableButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FDEEEE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  disableText: {
    color: "#D64545",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  emptyCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333333",
  },

  emptyText: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#6C4AB6",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 11,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});