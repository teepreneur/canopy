import { Link, router } from "expo-router";
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
} from "react-native";
import { Button } from "../../components/Button";
import { useAuth } from "../../lib/auth";
import { colors, borderRadius, spacing } from "../../lib/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register({ full_name: fullName.trim(), email: email.trim().toLowerCase(), password });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Registration failed", "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🌳</Text>
          <Text style={styles.title}>canopy</Text>
          <Text style={styles.subtitle}>Create your family account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={colors.stone}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="parent@example.com"
            placeholderTextColor={colors.stone}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.stone}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={colors.stone}
            secureTextEntry
          />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.md }} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.forest,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.stone,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.earth,
    marginTop: spacing.sm,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.stone,
    fontSize: 14,
  },
  link: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "600",
  },
});
