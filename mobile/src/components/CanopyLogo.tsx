import Svg, { Circle, Rect } from "react-native-svg";

export function CanopyLogo({ size = 28, color = "#1B5E43" }: { size?: number; color?: string }) {
  const s = size / 32;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="10" r="7" fill={color} opacity={0.3} />
      <Circle cx="11" cy="12" r="5.5" fill={color} opacity={0.5} />
      <Circle cx="21" cy="12" r="5.5" fill={color} opacity={0.5} />
      <Circle cx="16" cy="9" r="5" fill={color} opacity={0.7} />
      <Rect x="14.5" y="17" width="3" height="9" rx="1.5" fill={color} opacity={0.6} />
      <Circle cx="16" cy="28" r="1.5" fill="#E8A838" />
    </Svg>
  );
}
