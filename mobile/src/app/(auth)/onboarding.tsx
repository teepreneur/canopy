import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CanopyLogo } from "../../components/CanopyLogo";
import { apiFetch } from "../../lib/api";
import { colors, borderRadius, spacing } from "../../lib/theme";
import type { Family, ChildProfile, PairingCode } from "../../types/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AGE_RANGES = ["Under 5", "5 – 8", "9 – 12", "13+"];
const AVATAR_COLORS = [colors.sunlight, colors.sage, "#c9947d", colors.forest];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && styles.dotDone,
            i === current && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

function StepHeader({
  onBack,
  onSkip,
  showBack,
  skipLabel,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  showBack: boolean;
  skipLabel?: string;
}) {
  return (
    <View style={styles.stepHeader}>
      {showBack ? (
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.stone} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : (
        <View />
      )}
      {skipLabel ? (
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>{skipLabel}</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  loading,
  secondary,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.primaryBtn, secondary && styles.secondaryBtn]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={[styles.primaryBtnText, secondary && styles.secondaryBtnText]}>
        {loading ? "..." : title}
      </Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  // Step 2: Family name
  const [familyName, setFamilyName] = useState("");

  // Step 3: Child
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("9 – 12");
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // Step 4: Pairing
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  const totalSteps = 5;

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => router.replace("/(tabs)");

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert("Missing name", "Please enter your family name.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch<Family>("/auth/family", {
        method: "POST",
        body: JSON.stringify({ name: familyName.trim() }),
      });
      goNext();
    } catch {
      Alert.alert("Error", "Could not create family. It may already exist.");
      goNext();
    } finally {
      setLoading(false);
    }
  };

  const ageToNumber = (range: string): number | undefined => {
    switch (range) {
      case "Under 5": return 4;
      case "5 – 8": return 7;
      case "9 – 12": return 10;
      case "13+": return 14;
      default: return undefined;
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) {
      Alert.alert("Missing name", "Please enter your child's name.");
      return;
    }
    setLoading(true);
    try {
      const child = await apiFetch<ChildProfile>("/auth/family/children", {
        method: "POST",
        body: JSON.stringify({
          name: childName.trim(),
          age: ageToNumber(childAge),
        }),
      });
      setCreatedChildId(child.id);
      goNext();
    } catch {
      Alert.alert("Error", "Could not add child profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePairingCode = async () => {
    setPairingLoading(true);
    try {
      const result = await apiFetch<PairingCode>("/devices/pairing-code", {
        method: "POST",
        body: JSON.stringify(
          createdChildId ? { child_profile_id: createdChildId } : {},
        ),
      });
      setPairingCode(result.code);
    } catch {
      Alert.alert("Error", "Could not generate pairing code.");
    } finally {
      setPairingLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      // Welcome
      case 0:
        return (
          <View style={styles.stepContainer}>
            <StepHeader showBack={false} onSkip={finish} skipLabel="Skip" />
            <View style={styles.centerContent}>
              <LinearGradient
                colors={[colors.forest, colors.sage]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.welcomeCircle}
              >
                <CanopyLogo size={80} color="#fff" />
              </LinearGradient>
              <View style={styles.welcomeMark}>
                <CanopyLogo size={36} color={colors.forest} />
                <Text style={styles.welcomeMarkText}>canopy</Text>
              </View>
              <Text style={styles.stepTitle}>A safe place to grow</Text>
              <Text style={styles.stepSub}>
                Help your family build healthy digital habits with gentle
                boundaries and shared understanding.
              </Text>
            </View>
            <View style={styles.footer}>
              <PrimaryButton title="Get Started" onPress={goNext} />
              <Pressable onPress={() => router.back()} style={styles.signinLink}>
                <Text style={styles.signinText}>
                  Already have an account?{" "}
                  <Text style={styles.signinBold}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        );

      // Create Family
      case 1:
        return (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.stepContainer}
              keyboardShouldPersistTaps="handled"
            >
              <StepHeader showBack onBack={goBack} />
              <StepDots current={step} total={4} />
              <View style={styles.stepBody}>
                <LinearGradient
                  colors={["#FFF3E0", "#FCE4EC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.illustration}
                >
                  <Ionicons name="people" size={48} color={colors.sunlight} />
                </LinearGradient>
                <Text style={styles.stepTitle}>Name your family</Text>
                <Text style={styles.stepSub}>
                  This is how your family appears in Canopy. You can always
                  change it later.
                </Text>
                <View style={styles.formSection}>
                  <Text style={styles.label}>FAMILY NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="e.g. The Tetteh Family"
                    placeholderTextColor={colors.stone}
                  />
                </View>
              </View>
              <View style={styles.footer}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleCreateFamily}
                  loading={loading}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      // Add Child
      case 2:
        return (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.stepContainer}
              keyboardShouldPersistTaps="handled"
            >
              <StepHeader showBack onBack={goBack} />
              <StepDots current={step} total={4} />
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Add your first child</Text>
                <Text style={styles.stepSub}>
                  Choose an avatar color and enter their details.
                </Text>

                <View style={styles.avatarRow}>
                  {AVATAR_COLORS.map((color, i) => (
                    <Pressable
                      key={i}
                      style={[
                        styles.avatarOption,
                        { backgroundColor: color },
                        selectedAvatar === i && styles.avatarSelected,
                      ]}
                      onPress={() => setSelectedAvatar(i)}
                    >
                      <Text style={styles.avatarLetter}>
                        {(childName || "A").charAt(0).toUpperCase()}
                      </Text>
                      {selectedAvatar === i && (
                        <View style={styles.avatarCheck}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.label}>CHILD'S NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={childName}
                    onChangeText={setChildName}
                    placeholder="e.g. Kwame"
                    placeholderTextColor={colors.stone}
                  />

                  <Text style={[styles.label, { marginTop: 16 }]}>
                    AGE RANGE
                  </Text>
                  <View style={styles.ageRow}>
                    {AGE_RANGES.map((range) => (
                      <Pressable
                        key={range}
                        style={[
                          styles.ageChip,
                          childAge === range && styles.ageChipActive,
                        ]}
                        onPress={() => setChildAge(range)}
                      >
                        <Text
                          style={[
                            styles.ageChipText,
                            childAge === range && styles.ageChipTextActive,
                          ]}
                        >
                          {range}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.footer}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleAddChild}
                  loading={loading}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      // Pair Device
      case 3:
        return (
          <View style={styles.stepContainer}>
            <StepHeader
              showBack
              onBack={goBack}
              onSkip={goNext}
              skipLabel="Later"
            />
            <StepDots current={step} total={4} />
            <View style={styles.stepBody}>
              <LinearGradient
                colors={[colors.forest + "20", colors.sage + "30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustration}
              >
                <Ionicons name="laptop-outline" size={48} color={colors.forest} />
              </LinearGradient>
              <Text style={styles.stepTitle}>Pair a device</Text>
              <Text style={styles.stepSub}>
                Install the Canopy agent on your child's computer, then enter the
                code shown here.
              </Text>

              {pairingCode ? (
                <View style={styles.pairingCodeBox}>
                  <Text style={styles.pairingCodeText}>{pairingCode}</Text>
                  <Text style={styles.pairingCodeExpiry}>
                    Expires in 14 minutes
                  </Text>
                </View>
              ) : (
                <PrimaryButton
                  title="Generate Pairing Code"
                  onPress={handleGeneratePairingCode}
                  loading={pairingLoading}
                />
              )}

              <View style={styles.checklist}>
                <View style={styles.checkItem}>
                  <View style={[styles.checkIcon, styles.checkDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <Text style={styles.checkText}>Download Canopy Agent</Text>
                </View>
                <View style={styles.checkItem}>
                  <View style={[styles.checkIcon, styles.checkDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <Text style={styles.checkText}>
                    Install on child's device
                  </Text>
                </View>
                <View style={styles.checkItem}>
                  <View style={[styles.checkIcon, styles.checkPending]}>
                    <Ionicons name="add" size={14} color={colors.stone} />
                  </View>
                  <Text style={styles.checkText}>Enter pairing code</Text>
                </View>
              </View>
            </View>
            <View style={styles.footer}>
              {pairingCode && (
                <PrimaryButton title="Pair Device" onPress={goNext} />
              )}
              <PrimaryButton
                title="I'll do this later"
                onPress={goNext}
                secondary
              />
            </View>
          </View>
        );

      // Success
      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.centerContent}>
              <Text style={styles.confetti}>🎉</Text>
              <LinearGradient
                colors={[colors.forest, colors.sage]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successCircle}
              >
                <Ionicons name="checkmark" size={60} color="#fff" />
              </LinearGradient>
              <Text style={styles.stepTitle}>You're all set!</Text>
              <Text style={styles.stepSub}>
                Your family's Canopy is ready. You can explore your dashboard,
                add more children, or pair more devices any time.
              </Text>
            </View>
            <View style={styles.footer}>
              <PrimaryButton title="Go to Dashboard" onPress={finish} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.screen}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.meadow,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 34,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.stone,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.stone,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: colors.forest,
  },
  dotDone: {
    backgroundColor: colors.sage,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 28,
  },
  welcomeMarkText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.forest,
    letterSpacing: 0.2,
  },
  stepBody: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 15,
    color: colors.stone,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 28,
  },
  formSection: {
    width: "100%",
    alignSelf: "stretch",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.stone,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.earth,
    fontSize: 16,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: colors.forest,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  avatarCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  ageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  ageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  ageChipActive: {
    borderColor: colors.forest,
    backgroundColor: colors.forest + "10",
  },
  ageChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.stone,
  },
  ageChipTextActive: {
    color: colors.forest,
  },
  pairingCodeBox: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 20,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  pairingCodeText: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.earth,
    letterSpacing: 4,
  },
  pairingCodeExpiry: {
    fontSize: 13,
    color: colors.stone,
    marginTop: 6,
  },
  checklist: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: colors.sage,
  },
  checkPending: {
    backgroundColor: colors.border,
  },
  checkText: {
    fontSize: 15,
    color: colors.earth,
    fontWeight: "600",
  },
  confetti: {
    fontSize: 48,
    marginBottom: 16,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    gap: 10,
    paddingTop: 16,
  },
  primaryBtn: {
    backgroundColor: colors.forest,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.border,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  secondaryBtnText: {
    color: colors.earth,
  },
  signinLink: {
    alignItems: "center",
    paddingTop: 14,
  },
  signinText: {
    fontSize: 14,
    color: colors.stone,
  },
  signinBold: {
    color: colors.forest,
    fontWeight: "700",
  },
});
