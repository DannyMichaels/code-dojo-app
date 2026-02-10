export const APP_NAME = 'Code Dojo';
export const AUTHOR_NAME = 'Daniel Michael';

export function BrandIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Anvil body */}
      <path
        d="M12 44h40l4 8H8l4-8z"
        fill={color}
        opacity={0.3}
      />
      <path
        d="M16 32h32c2 0 4 2 4 4v8H12v-8c0-2 2-4 4-4z"
        fill={color}
        opacity={0.5}
      />
      {/* Anvil top / horn */}
      <path
        d="M20 32h24v-4c0-2-2-4-4-4H24c-2 0-4 2-4 4v4z"
        fill={color}
        opacity={0.7}
      />
      <path
        d="M8 52h48v4H8v-4z"
        fill={color}
        opacity={0.4}
      />
      {/* Code brackets */}
      <path
        d="M24 14l-8 8 8 8"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 14l8 8-8 8"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Slash */}
      <line
        x1={36}
        y1={12}
        x2={28}
        y2={32}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  );
}
