import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { Button } from "../components/Button";
import { colors, borderRadius, spacing } from "../lib/theme";
import type { Rule } from "../types/api";

const RULE_TYPES: { value: Rule["rule_type"]; label: string; placeholder: string }[] = [
  { value: "block_site", label: "Block Website", placeholder: "e.g. tiktok.com" },
  { value: "block_app", label: "Block App", placeholder: "e.g. Discord" },
  { value: "time_limit", label: "Time Limit", placeholder: "e.g. Gaming, Social Media" },
  { value: "schedule", label: "Schedule", placeholder: "e.g. Homework time" },
];

export default function AddRuleScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const [ruleType, setRuleType] = useState<Rule["rule_type"]>("block_site");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = RULE_TYPES.find((r) => r.value === ruleType)!;

  const handleCreate = () => {
    if (!target.trim()) {
      Alert.alert("Missing target", "Please enter what to block or limit.");
      return;
    }
    setLoading(true);
    // Mock save
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Rule Type</Text>
        <View style={styles.typeGrid}>
          {RULE_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[styles.typeChip, ruleType === type.value && styles.typeChipActive]}
              onPress={() => setRuleType(type.value)}
            >
              <Text style={[styles.typeText, ruleType === type.value && styles.typeTextActive]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Target</Text>
        <TextInput
          style={styles.input}
          value={target}
          onChangeText={setTarget}
          placeholder={selected.placeholder}
          placeholderTextColor={colors.stone}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Create Rule"
          onPress={handleCreate}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.earth,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.forest + "10",
    borderColor: colors.forest,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.stone,
  },
  typeTextActive: {
    color: colors.forest,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.earth,
  },
});
