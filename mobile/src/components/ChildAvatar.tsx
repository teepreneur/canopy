import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from "react-native-svg";

export type AvatarId =
  | "zuri"
  | "kofi"
  | "amara"
  | "jaden"
  | "nia"
  | "ezra"
  | "lila"
  | "kai";

interface Props {
  id: AvatarId;
  size?: number;
}

const SKIN = {
  deep: "#8B5E3C",
  rich: "#A0714F",
  warm: "#C08B5C",
  golden: "#D4A574",
  light: "#E8C49B",
  peach: "#F0D5B8",
};

// Zuri — girl, deep skin, big curly afro puffs, warm smile
function Zuri({ s }: { s: number }) {
  const scale = s / 80;
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <G scale={1}>
        {/* Background */}
        <Circle cx="40" cy="40" r="40" fill="#FFE0CC" />
        {/* Hair — big afro puffs */}
        <Circle cx="24" cy="22" r="16" fill="#2C1810" />
        <Circle cx="56" cy="22" r="16" fill="#2C1810" />
        <Ellipse cx="40" cy="30" rx="20" ry="14" fill="#2C1810" />
        {/* Face */}
        <Ellipse cx="40" cy="42" rx="18" ry="20" fill={SKIN.deep} />
        {/* Eyes */}
        <Ellipse cx="33" cy="40" rx="3.5" ry="4" fill="white" />
        <Circle cx="33.5" cy="40.5" r="2.2" fill="#1A1A1A" />
        <Circle cx="34.2" cy="39.5" r="0.8" fill="white" />
        <Ellipse cx="47" cy="40" rx="3.5" ry="4" fill="white" />
        <Circle cx="47.5" cy="40.5" r="2.2" fill="#1A1A1A" />
        <Circle cx="48.2" cy="39.5" r="0.8" fill="white" />
        {/* Eyebrows */}
        <Path d="M29 36 Q33 33 37 35.5" stroke="#1A1A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <Path d="M43 35.5 Q47 33 51 36" stroke="#1A1A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Nose */}
        <Path d="M38 44 Q40 47 42 44" stroke={SKIN.rich} strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Smile */}
        <Path d="M33 50 Q40 57 47 50" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Cheek blush */}
        <Circle cx="28" cy="47" r="3.5" fill="#D4654A" opacity={0.2} />
        <Circle cx="52" cy="47" r="3.5" fill="#D4654A" opacity={0.2} />
        {/* Hair accessory — yellow band on puff */}
        <Path d="M16 22 Q24 28 32 22" stroke="#E8A838" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M48 22 Q56 28 64 22" stroke="#E8A838" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Shirt collar */}
        <Path d="M22 62 Q40 68 58 62" fill="#74B49B" />
      </G>
    </Svg>
  );
}

// Kofi — boy, rich skin, short fade, confident grin
function Kofi({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      {/* Background */}
      <Circle cx="40" cy="40" r="40" fill="#E0F0E8" />
      {/* Hair — short fade */}
      <Path d="M22 32 Q22 16 40 14 Q58 16 58 32 L58 34 Q58 28 40 26 Q22 28 22 34 Z" fill="#1A1408" />
      <Ellipse cx="40" cy="26" rx="18" ry="8" fill="#1A1408" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="18" ry="20" fill={SKIN.rich} />
      {/* Eyes */}
      <Ellipse cx="33" cy="40" rx="3.2" ry="3.8" fill="white" />
      <Circle cx="33.5" cy="40.5" r="2" fill="#2A1A0A" />
      <Circle cx="34" cy="39.8" r="0.7" fill="white" />
      <Ellipse cx="47" cy="40" rx="3.2" ry="3.8" fill="white" />
      <Circle cx="47.5" cy="40.5" r="2" fill="#2A1A0A" />
      <Circle cx="48" cy="39.8" r="0.7" fill="white" />
      {/* Eyebrows — confident */}
      <Path d="M29 35.5 Q33 33 37 35" stroke="#1A1408" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M43 35 Q47 33 51 35.5" stroke="#1A1408" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38 44 Q40 47 42 44" stroke="#8B5E3C" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Grin */}
      <Path d="M32 49 Q40 56 48 49" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M34 50 Q40 54 46 50" fill="white" opacity={0.9} />
      {/* Cheeks */}
      <Circle cx="27" cy="46" r="3" fill="#D4654A" opacity={0.15} />
      <Circle cx="53" cy="46" r="3" fill="#D4654A" opacity={0.15} />
      {/* Shirt */}
      <Path d="M22 62 Q40 68 58 62" fill="#E8A838" />
    </Svg>
  );
}

// Amara — girl, golden skin, long braids, sparkle eyes
function Amara({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#FFF5E6" />
      {/* Hair — long braids */}
      <Path d="M22 30 Q22 16 40 14 Q58 16 58 30" fill="#2C1810" />
      <Ellipse cx="40" cy="26" rx="19" ry="10" fill="#2C1810" />
      {/* Braids falling down */}
      <Path d="M22 30 Q20 50 18 65" stroke="#2C1810" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M58 30 Q60 50 62 65" stroke="#2C1810" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Braid beads */}
      <Circle cx="18" cy="58" r="2.5" fill="#E8A838" />
      <Circle cx="18" cy="52" r="2.5" fill="#74B49B" />
      <Circle cx="62" cy="58" r="2.5" fill="#E8A838" />
      <Circle cx="62" cy="52" r="2.5" fill="#74B49B" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="17" ry="19" fill={SKIN.golden} />
      {/* Eyes — big and sparkly */}
      <Ellipse cx="33" cy="40" rx="3.8" ry="4.5" fill="white" />
      <Circle cx="33.5" cy="40.5" r="2.5" fill="#3A2518" />
      <Circle cx="34.3" cy="39.3" r="1" fill="white" />
      <Circle cx="32.5" cy="41" r="0.5" fill="white" />
      <Ellipse cx="47" cy="40" rx="3.8" ry="4.5" fill="white" />
      <Circle cx="47.5" cy="40.5" r="2.5" fill="#3A2518" />
      <Circle cx="48.3" cy="39.3" r="1" fill="white" />
      <Circle cx="46.5" cy="41" r="0.5" fill="white" />
      {/* Lashes */}
      <Path d="M29 38 L28 36" stroke="#2C1810" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M30 37 L29.5 35" stroke="#2C1810" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M51 38 L52 36" stroke="#2C1810" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M50 37 L50.5 35" stroke="#2C1810" strokeWidth="0.8" strokeLinecap="round" />
      {/* Eyebrows */}
      <Path d="M29 35 Q33 32 37 34.5" stroke="#2C1810" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M43 34.5 Q47 32 51 35" stroke="#2C1810" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38.5 44 Q40 46.5 41.5 44" stroke="#C08B5C" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Gentle smile */}
      <Path d="M35 50 Q40 54 45 50" stroke="#1A1A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Circle cx="28" cy="46" r="3.5" fill="#E8A838" opacity={0.15} />
      <Circle cx="52" cy="46" r="3.5" fill="#E8A838" opacity={0.15} />
      {/* Headband */}
      <Path d="M22 28 Q40 24 58 28" stroke="#D4654A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Shirt */}
      <Path d="M23 62 Q40 68 57 62" fill="#D4654A" />
    </Svg>
  );
}

// Jaden — boy, warm skin, curly top, playful expression
function Jaden({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#E8EEF8" />
      {/* Hair — curly top */}
      <Circle cx="32" cy="18" r="6" fill="#3A2518" />
      <Circle cx="40" cy="16" r="7" fill="#3A2518" />
      <Circle cx="48" cy="18" r="6" fill="#3A2518" />
      <Circle cx="36" cy="20" r="6" fill="#3A2518" />
      <Circle cx="44" cy="20" r="6" fill="#3A2518" />
      <Circle cx="28" cy="24" r="5" fill="#3A2518" />
      <Circle cx="52" cy="24" r="5" fill="#3A2518" />
      <Ellipse cx="40" cy="28" rx="18" ry="6" fill="#3A2518" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="17" ry="19" fill={SKIN.warm} />
      {/* Eyes — playful, one slightly squinted */}
      <Ellipse cx="33" cy="40" rx="3.2" ry="3.5" fill="white" />
      <Circle cx="33.5" cy="40.5" r="2" fill="#2A1A0A" />
      <Circle cx="34" cy="39.8" r="0.7" fill="white" />
      <Ellipse cx="47" cy="40.5" rx="3.2" ry="2.8" fill="white" />
      <Circle cx="47.5" cy="40.8" r="1.8" fill="#2A1A0A" />
      <Circle cx="48" cy="40.2" r="0.6" fill="white" />
      {/* Eyebrows */}
      <Path d="M29 35.5 Q33 33.5 37 35" stroke="#3A2518" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M43 34.5 Q47 32.5 51 35" stroke="#3A2518" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38 44 Q40 47 42 44" stroke="#A0714F" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Cheeky smile */}
      <Path d="M33 49 Q37 55 41 50" stroke="#1A1A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M41 50 Q45 55 48 49" stroke="#1A1A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Tongue peeking */}
      <Ellipse cx="40" cy="53" rx="3" ry="2" fill="#E87070" />
      {/* Cheeks */}
      <Circle cx="27" cy="47" r="3" fill="#D4654A" opacity={0.2} />
      <Circle cx="53" cy="47" r="3" fill="#D4654A" opacity={0.2} />
      {/* Shirt */}
      <Path d="M23 62 Q40 68 57 62" fill="#1B5E43" />
    </Svg>
  );
}

// Nia — girl, light skin, big puffy natural hair, flower
function Nia({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#F5E6F0" />
      {/* Hair — big puffy natural */}
      <Ellipse cx="40" cy="26" rx="26" ry="20" fill="#4A3228" />
      <Circle cx="20" cy="30" r="10" fill="#4A3228" />
      <Circle cx="60" cy="30" r="10" fill="#4A3228" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="16" ry="19" fill={SKIN.light} />
      {/* Eyes */}
      <Ellipse cx="34" cy="40" rx="3.5" ry="4" fill="white" />
      <Circle cx="34.5" cy="40.5" r="2.2" fill="#4A3228" />
      <Circle cx="35" cy="39.6" r="0.8" fill="white" />
      <Ellipse cx="46" cy="40" rx="3.5" ry="4" fill="white" />
      <Circle cx="46.5" cy="40.5" r="2.2" fill="#4A3228" />
      <Circle cx="47" cy="39.6" r="0.8" fill="white" />
      {/* Lashes */}
      <Path d="M30 38 L29 36.5" stroke="#4A3228" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M50 38 L51 36.5" stroke="#4A3228" strokeWidth="0.8" strokeLinecap="round" />
      {/* Eyebrows */}
      <Path d="M30 35.5 Q34 33 38 35" stroke="#4A3228" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M42 35 Q46 33 50 35.5" stroke="#4A3228" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38.5 44 Q40 46 41.5 44" stroke="#D4A574" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Sweet smile */}
      <Path d="M35 49 Q40 54 45 49" stroke="#1A1A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Circle cx="28" cy="46" r="3" fill="#F0A0B0" opacity={0.25} />
      <Circle cx="52" cy="46" r="3" fill="#F0A0B0" opacity={0.25} />
      {/* Flower in hair */}
      <Circle cx="56" cy="20" r="4" fill="#D4654A" />
      <Circle cx="56" cy="20" r="2" fill="#E8A838" />
      {/* Shirt */}
      <Path d="M24 62 Q40 68 56 62" fill="#A855F7" />
    </Svg>
  );
}

// Ezra — boy, peach skin, wavy hair, round glasses, studious
function Ezra({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#E6F0E8" />
      {/* Hair — wavy swoosh */}
      <Path d="M22 32 Q22 14 40 12 Q58 14 58 32" fill="#5C3A1E" />
      <Ellipse cx="40" cy="24" rx="19" ry="10" fill="#5C3A1E" />
      <Path d="M24 24 Q30 18 42 20 Q48 16 56 22" fill="#5C3A1E" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="17" ry="19" fill={SKIN.peach} />
      {/* Glasses */}
      <Circle cx="33" cy="40" r="6" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />
      <Circle cx="47" cy="40" r="6" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />
      <Path d="M39 40 L41 40" stroke="#4A4A4A" strokeWidth="1.5" />
      <Path d="M27 40 L22 38" stroke="#4A4A4A" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M53 40 L58 38" stroke="#4A4A4A" strokeWidth="1.2" strokeLinecap="round" />
      {/* Eyes behind glasses */}
      <Ellipse cx="33" cy="40" rx="2.5" ry="3" fill="white" />
      <Circle cx="33.5" cy="40.5" r="1.8" fill="#5C3A1E" />
      <Circle cx="34" cy="39.8" r="0.6" fill="white" />
      <Ellipse cx="47" cy="40" rx="2.5" ry="3" fill="white" />
      <Circle cx="47.5" cy="40.5" r="1.8" fill="#5C3A1E" />
      <Circle cx="48" cy="39.8" r="0.6" fill="white" />
      {/* Eyebrows */}
      <Path d="M28 33 Q33 30.5 38 33" stroke="#5C3A1E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M42 33 Q47 30.5 52 33" stroke="#5C3A1E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M39 44 Q40 46 41 44" stroke="#E8C49B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Slight smile */}
      <Path d="M36 50 Q40 53 44 50" stroke="#1A1A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Freckles */}
      <Circle cx="29" cy="44" r="0.7" fill="#D4A574" opacity={0.5} />
      <Circle cx="31" cy="46" r="0.7" fill="#D4A574" opacity={0.5} />
      <Circle cx="49" cy="44" r="0.7" fill="#D4A574" opacity={0.5} />
      <Circle cx="51" cy="46" r="0.7" fill="#D4A574" opacity={0.5} />
      {/* Shirt */}
      <Path d="M23 62 Q40 68 57 62" fill="#3B82F6" />
    </Svg>
  );
}

// Lila — girl, rich skin, cornrows with purple ends, energetic
function Lila({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#F0E6FF" />
      {/* Hair — cornrows */}
      <Ellipse cx="40" cy="26" rx="19" ry="10" fill="#1A1408" />
      <Path d="M26 20 L22 40" stroke="#1A1408" strokeWidth="3" strokeLinecap="round" />
      <Path d="M32 18 L28 42" stroke="#1A1408" strokeWidth="3" strokeLinecap="round" />
      <Path d="M40 16 L40 38" stroke="#1A1408" strokeWidth="3" strokeLinecap="round" />
      <Path d="M48 18 L52 42" stroke="#1A1408" strokeWidth="3" strokeLinecap="round" />
      <Path d="M54 20 L58 40" stroke="#1A1408" strokeWidth="3" strokeLinecap="round" />
      {/* Purple ends */}
      <Circle cx="22" cy="42" r="2.5" fill="#A855F7" />
      <Circle cx="28" cy="44" r="2.5" fill="#A855F7" />
      <Circle cx="52" cy="44" r="2.5" fill="#A855F7" />
      <Circle cx="58" cy="42" r="2.5" fill="#A855F7" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="16" ry="19" fill={SKIN.rich} />
      {/* Eyes — big, energetic */}
      <Ellipse cx="34" cy="39" rx="3.5" ry="4.2" fill="white" />
      <Circle cx="34.5" cy="39" r="2.3" fill="#1A1A1A" />
      <Circle cx="35.2" cy="38.2" r="0.9" fill="white" />
      <Circle cx="33.8" cy="39.8" r="0.4" fill="white" />
      <Ellipse cx="46" cy="39" rx="3.5" ry="4.2" fill="white" />
      <Circle cx="46.5" cy="39" r="2.3" fill="#1A1A1A" />
      <Circle cx="47.2" cy="38.2" r="0.9" fill="white" />
      <Circle cx="45.8" cy="39.8" r="0.4" fill="white" />
      {/* Eyebrows — raised, excited */}
      <Path d="M30 33 Q34 30 38 33" stroke="#1A1408" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M42 33 Q46 30 50 33" stroke="#1A1408" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38 44 Q40 46.5 42 44" stroke="#8B5E3C" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Big open smile */}
      <Path d="M33 49 Q40 57 47 49" stroke="#1A1A1A" strokeWidth="1.3" fill="#1A1A1A" />
      <Path d="M34 49.5 Q40 47 46 49.5" fill="white" />
      {/* Cheeks */}
      <Circle cx="28" cy="46" r="3" fill="#D4654A" opacity={0.2} />
      <Circle cx="52" cy="46" r="3" fill="#D4654A" opacity={0.2} />
      {/* Star earrings */}
      <Path d="M21 42 L22 40 L23 42 L21 41 L23 41 Z" fill="#E8A838" />
      <Path d="M57 42 L58 40 L59 42 L57 41 L59 41 Z" fill="#E8A838" />
      {/* Shirt */}
      <Path d="M24 62 Q40 68 56 62" fill="#E8A838" />
    </Svg>
  );
}

// Kai — boy, deep skin, neat lineup, calm cool expression
function Kai({ s }: { s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="40" fill="#E0E8F0" />
      {/* Hair — neat flat top / lineup */}
      <Rect x="24" y="18" width="32" height="14" rx="3" fill="#1A1408" />
      <Ellipse cx="40" cy="30" rx="18" ry="4" fill="#1A1408" />
      {/* Clean lineup edge */}
      <Path d="M24 32 L24 26 Q24 22 28 20 L52 20 Q56 22 56 26 L56 32" stroke="#1A1408" strokeWidth="0.5" fill="none" />
      {/* Face */}
      <Ellipse cx="40" cy="42" rx="17" ry="19" fill={SKIN.deep} />
      {/* Eyes — cool, slightly narrow */}
      <Ellipse cx="33" cy="41" rx="3" ry="3" fill="white" />
      <Circle cx="33.5" cy="41.2" r="1.8" fill="#1A1A1A" />
      <Circle cx="34" cy="40.5" r="0.6" fill="white" />
      <Ellipse cx="47" cy="41" rx="3" ry="3" fill="white" />
      <Circle cx="47.5" cy="41.2" r="1.8" fill="#1A1A1A" />
      <Circle cx="48" cy="40.5" r="0.6" fill="white" />
      {/* Eyebrows — straight, confident */}
      <Path d="M29 37 L37 36" stroke="#1A1408" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M43 36 L51 37" stroke="#1A1408" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M38 44 Q40 47 42 44" stroke="#6B4226" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Cool half smile */}
      <Path d="M36 50 Q42 53 46 50" stroke="#1A1A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <Circle cx="27" cy="47" r="3" fill="#D4654A" opacity={0.15} />
      <Circle cx="53" cy="47" r="3" fill="#D4654A" opacity={0.15} />
      {/* Shirt with collar */}
      <Path d="M23 62 Q40 68 57 62" fill="#D4654A" />
      <Path d="M35 62 L40 66 L45 62" stroke="white" strokeWidth="1" fill="none" />
    </Svg>
  );
}

const AVATAR_MAP: Record<AvatarId, React.FC<{ s: number }>> = {
  zuri: Zuri,
  kofi: Kofi,
  amara: Amara,
  jaden: Jaden,
  nia: Nia,
  ezra: Ezra,
  lila: Lila,
  kai: Kai,
};

export const AVATAR_LIST: AvatarId[] = [
  "zuri",
  "kofi",
  "amara",
  "jaden",
  "nia",
  "ezra",
  "lila",
  "kai",
];

export function getAvatarForChild(name: string, index: number): AvatarId {
  return AVATAR_LIST[index % AVATAR_LIST.length];
}

export function ChildAvatar({ id, size = 48 }: Props) {
  const Component = AVATAR_MAP[id];
  if (!Component) return null;
  return <Component s={size} />;
}
