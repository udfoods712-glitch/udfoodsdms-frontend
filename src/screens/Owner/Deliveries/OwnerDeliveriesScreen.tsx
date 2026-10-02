import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
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

interface Delivery {
  id: number;
  consignment_name: string;
  amount: number;
  delivery_address: string;
  notes?: string | null;
  driver_id: number;
  driver_name: string;
  created_by: number;
  status:
    | "SCHEDULED"
    | "IN_TRANSIT"
    | "COMPLETED";
  scheduled_date: string;
}

type Filter =
  | "ALL"
  | "SCHEDULED"
  | "IN_TRANSIT"
  | "COMPLETED";

export default function OwnerDeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<
    Delivery[]
  >([]);

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeliveries = async () => {
    try {
      const token = await getToken();

      const response = await api.get(
        "/deliveries/archive",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDeliveries(response.data);
    } catch (error: any) {
      console.log(
        "OWNER DELIVERY ARCHIVE ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to load deliveries",
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
      fetchDeliveries();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const filteredDeliveries = useMemo(() => {
    if (filter === "ALL") {
      return deliveries;
    }

    return deliveries.filter(
      (delivery) => delivery.status === filter
    );
  }, [deliveries, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return "#2E9D5B";

      case "COMPLETED":
        return "#6C4AB6";

      default:
        return "#D88924";
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return "#EAF7EF";

      case "COMPLETED":
        return "#EEE8F8";

      default:
        return "#FFF4E5";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return "In Transit";

      case "COMPLETED":
        return "Completed";

      default:
        return "Scheduled";
    }
  };

  const renderDelivery = ({
    item,
  }: {
    item: Delivery;
  }) => {
    const statusColor = getStatusColor(item.status);

    const statusBackground =
      getStatusBackground(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="cube-outline"
              size={22}
              color="#6C4AB6"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>
              {item.consignment_name}
            </Text>

            <Text style={styles.address}>
              {item.delivery_address}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBackground,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>
              Amount
            </Text>

            <Text style={styles.detailValue}>
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.detail}>
            <Text style={styles.detailLabel}>
              Driver
            </Text>

            <Text style={styles.detailValue}>
              {item.driver_name}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color="#888888"
            />

            <Text style={styles.dateText}>
              {formatDate(item.scheduled_date)}
            </Text>
          </View>

          <View style={styles.dateItem}>
            <Ionicons
              name="time-outline"
              size={15}
              color="#888888"
            />

            <Text style={styles.dateText}>
              {formatTime(item.scheduled_date)}
            </Text>
          </View>

          <Text style={styles.idText}>
            #{item.id}
          </Text>
        </View>

        {item.notes ? (
          <View style={styles.notesContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#888888"
            />

            <Text style={styles.notes}>
              {item.notes}
            </Text>
          </View>
        ) : null}
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
        data={filteredDeliveries}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={renderDelivery}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C4AB6"
          />
        }
        contentContainerStyle={
          filteredDeliveries.length === 0
            ? styles.emptyContent
            : styles.content
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>
                  Deliveries
                </Text>

                <Text style={styles.subtitle}>
                  Complete delivery history
                </Text>
              </View>


            </View>

            <View style={styles.filterContainer}>
              {(
                [
                  "ALL",
                  "SCHEDULED",
                  "IN_TRANSIT",
                  "COMPLETED",
                ] as Filter[]
              ).map((item) => {
                const active = filter === item;

                let label = "All";

                if (item === "SCHEDULED") {
                  label = "Scheduled";
                }

                if (item === "IN_TRANSIT") {
                  label = "In Transit";
                }

                if (item === "COMPLETED") {
                  label = "Completed";
                }

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.filterButton,
                      active &&
                        styles.filterButtonActive,
                    ]}
                    onPress={() =>
                      setFilter(item)
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {filter === "ALL"
                  ? "All Deliveries"
                  : getStatusLabel(filter)}
              </Text>

              <Text style={styles.resultCount}>
                {filteredDeliveries.length}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cube-outline"
                size={38}
                color="#6C4AB6"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No deliveries found
            </Text>

            <Text style={styles.emptyText}>
              There are no deliveries matching
              this filter.
            </Text>
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
    marginBottom: 18,
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

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 5,
    marginBottom: 20,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },

  filterButtonActive: {
    backgroundColor: "#6C4AB6",
  },

  filterText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888888",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  resultCount: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
    color: "#6C4AB6",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 11,
    fontWeight: "700",
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

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  address: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    lineHeight: 18,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: 14,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  detail: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EFF2",
  },

  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },

  dateText: {
    fontSize: 11,
    color: "#777777",
    marginLeft: 5,
  },

  idText: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#AAAAAA",
    fontWeight: "600",
  },

  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F7FA",
    borderRadius: 10,
    padding: 10,
    marginTop: 13,
  },

  notes: {
    flex: 1,
    fontSize: 12,
    color: "#777777",
    marginLeft: 7,
    lineHeight: 17,
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
});