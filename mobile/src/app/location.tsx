import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useChildren } from "../hooks/useFamily";

let MapView: any;
let Circle: any;
let Marker: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Circle = Maps.Circle;
  Marker = Maps.Marker;
}
import {
  useLatestLocations,
  useGeofences,
  useCreateGeofence,
  useDeleteGeofence,
} from "../hooks/useLocation";
import { colors, spacing } from "../lib/theme";
import { ChildAvatar, getAvatarForChild } from "../components/ChildAvatar";
import type {
  LocationUpdate as LocationType,
  Geofence,
  ChildProfile,
} from "../types/api";

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ChildLocationCard({
  child,
  location,
  childIndex,
}: {
  child: ChildProfile;
  location: LocationType | undefined;
  childIndex: number;
}) {
  return (
    <View style={styles.childLocCard}>
      <View style={styles.childLocTop}>
        <View style={styles.childLocAvatar}>
          <ChildAvatar id={getAvatarForChild(child.name, childIndex)} size={40} />
        </View>
        <View style={styles.childLocInfo}>
          <Text style={styles.childLocName}>{child.name}</Text>
          {location ? (
            <>
              <Text style={styles.childLocAddress}>
                {location.address ?? "Location available"}
              </Text>
              <Text style={styles.childLocTime}>
                {timeAgo(location.created_at)}
              </Text>
            </>
          ) : (
            <Text style={styles.childLocAddress}>No location data</Text>
          )}
        </View>
        {location && (
          <View style={styles.locBadge}>
            <View style={styles.locDot} />
            <Text style={styles.locBadgeText}>Live</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function GeofenceCard({
  geofence,
  onDelete,
}: {
  geofence: Geofence;
  onDelete: () => void;
}) {
  return (
    <View style={styles.geofenceCard}>
      <View style={styles.geofenceIcon}>
        <Ionicons
          name={geofence.is_safe_zone ? "shield-checkmark" : "warning"}
          size={18}
          color={geofence.is_safe_zone ? colors.forest : colors.coral}
        />
      </View>
      <View style={styles.geofenceInfo}>
        <Text style={styles.geofenceName}>{geofence.name}</Text>
        <Text style={styles.geofenceRadius}>
          {geofence.radius_meters}m radius
          {geofence.is_safe_zone ? " · Safe zone" : " · Restricted"}
        </Text>
      </View>
      <Pressable onPress={onDelete} style={styles.geofenceDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.coral} />
      </Pressable>
    </View>
  );
}

export default function LocationScreen() {
  const { data: children } = useChildren();
  const { data: locations, isLoading: locsLoading } = useLatestLocations();
  const { data: geofences, isLoading: geoLoading } = useGeofences();
  const createGeofence = useCreateGeofence();
  const deleteGeofence = useDeleteGeofence();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRadius, setNewRadius] = useState("200");

  const childList = children ?? [];
  const locationList = locations ?? [];
  const geofenceList = geofences ?? [];

  const isLoading = locsLoading || geoLoading;

  const defaultRegion = locationList.length > 0
    ? {
        latitude: locationList[0].latitude,
        longitude: locationList[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 5.6037,
        longitude: -0.187,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  const getChildForLocation = (loc: LocationType): ChildProfile | undefined =>
    childList.find((c) => c.id === loc.child_profile_id);

  const handleAddGeofence = () => {
    if (!newName.trim()) {
      Alert.alert("Missing name", "Please enter a zone name.");
      return;
    }
    const center = locationList[0] ?? { latitude: 5.6037, longitude: -0.187 };
    createGeofence.mutate(
      {
        name: newName.trim(),
        latitude: center.latitude,
        longitude: center.longitude,
        radius_meters: parseInt(newRadius, 10) || 200,
        is_safe_zone: true,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewRadius("200");
          setShowAddForm(false);
        },
      },
    );
  };

  const handleDeleteGeofence = (gf: Geofence) => {
    Alert.alert(
      "Delete Zone",
      `Remove "${gf.name}" geofence?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteGeofence.mutate(gf.id),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.earth} />
        </Pressable>
        <Text style={styles.pageTitle}>Location</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" && MapView ? (
          <MapView
            style={styles.map}
            initialRegion={defaultRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {locationList.map((loc) => {
              const child = getChildForLocation(loc);
              const ci = child ? childList.indexOf(child) : 0;
              return (
                <Marker
                  key={loc.id}
                  coordinate={{
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  }}
                  title={child?.name ?? "Device"}
                  description={loc.address ?? undefined}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.markerAvatar}>
                      <ChildAvatar
                        id={getAvatarForChild(child?.name ?? "D", ci)}
                        size={30}
                      />
                    </View>
                    <View style={styles.markerArrow} />
                  </View>
                </Marker>
              );
            })}

            {geofenceList
              .filter((gf) => gf.enabled)
              .map((gf) => (
                <Circle
                  key={gf.id}
                  center={{
                    latitude: gf.latitude,
                    longitude: gf.longitude,
                  }}
                  radius={gf.radius_meters}
                  strokeColor={
                    gf.is_safe_zone
                      ? colors.forest + "80"
                      : colors.coral + "80"
                  }
                  fillColor={
                    gf.is_safe_zone
                      ? colors.sage + "30"
                      : colors.coral + "20"
                  }
                  strokeWidth={2}
                />
              ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color={colors.sage} />
            <Text style={styles.mapPlaceholderText}>
              Map available on mobile
            </Text>
          </View>
        )}
      </View>

      {/* Children locations */}
      <Text style={styles.sectionTitle}>Children</Text>
      {childList.map((child, i) => {
        const loc = locationList.find(
          (l) => l.child_profile_id === child.id,
        );
        return (
          <ChildLocationCard key={child.id} child={child} location={loc} childIndex={i} />
        );
      })}

      {/* Geofences */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Safe Zones</Text>
        <Pressable
          style={styles.addZoneBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons
            name={showAddForm ? "close" : "add"}
            size={20}
            color={colors.forest}
          />
        </Pressable>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.addFormLabel}>ZONE NAME</Text>
          <TextInput
            style={styles.addFormInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Grandma's House"
            placeholderTextColor={colors.stone}
          />
          <Text style={styles.addFormLabel}>RADIUS (METERS)</Text>
          <TextInput
            style={styles.addFormInput}
            value={newRadius}
            onChangeText={setNewRadius}
            placeholder="200"
            placeholderTextColor={colors.stone}
            keyboardType="number-pad"
          />
          <Text style={styles.addFormHint}>
            Zone will be centered on the map's current view
          </Text>
          <Pressable style={styles.addFormBtn} onPress={handleAddGeofence}>
            <Text style={styles.addFormBtnText}>
              {createGeofence.isPending ? "Creating..." : "Create Zone"}
            </Text>
          </Pressable>
        </View>
      )}

      {geofenceList.length === 0 && !showAddForm ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={36} color={colors.stone} />
          <Text style={styles.emptyText}>No safe zones set up yet</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.emptyBtnText}>Add Zone</Text>
          </Pressable>
        </View>
      ) : (
        geofenceList.map((gf) => (
          <GeofenceCard
            key={gf.id}
            geofence={gf}
            onDelete={() => handleDeleteGeofence(gf)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.meadow,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.meadow,
  },
  container: {
    paddingBottom: spacing.xxl + 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
  },
  mapContainer: {
    marginHorizontal: spacing.md,
    borderRadius: 20,
    overflow: "hidden",
    height: 280,
    marginBottom: spacing.md,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage + "20",
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: colors.stone,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  markerText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
    marginTop: -1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.earth,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: spacing.md,
  },
  childLocCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: spacing.md,
    marginBottom: 10,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childLocTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  childLocAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  childLocAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  childLocInfo: {
    flex: 1,
  },
  childLocName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.earth,
  },
  childLocAddress: {
    fontSize: 13,
    color: colors.stone,
    marginTop: 1,
  },
  childLocTime: {
    fontSize: 11,
    color: colors.sage,
    marginTop: 1,
  },
  locBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest,
  },
  locBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.forest,
  },
  geofenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: spacing.md,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  geofenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forest + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  geofenceInfo: {
    flex: 1,
  },
  geofenceName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.earth,
  },
  geofenceRadius: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  geofenceDelete: {
    padding: 8,
  },
  addZoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addForm: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: spacing.md,
    marginBottom: 12,
  },
  addFormLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.stone,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  addFormInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.earth,
    marginBottom: 12,
  },
  addFormHint: {
    fontSize: 12,
    color: colors.stone,
    marginBottom: 12,
  },
  addFormBtn: {
    backgroundColor: colors.forest,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  addFormBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.stone,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.forest,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
