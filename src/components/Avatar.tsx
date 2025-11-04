import React from "react";

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: number; // pixels
  rounded?: boolean;
}

export default function Avatar({
  name,
  photoURL,
  size = 40,
  rounded = true,
}: AvatarProps) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  const dimensionStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded ? size / 2 : 8,
  };

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        style={dimensionStyle}
        className="object-cover"
      />
    );
  }

  return (
    <div
      style={dimensionStyle}
      className="bg-gray-200 flex items-center justify-center"
      aria-label={name}
      title={name}
    >
      <span
        className="font-bold text-gray-900"
        style={{ fontSize: Math.max(12, size * 0.4) }}
      >
        {initials}
      </span>
    </div>
  );
}
