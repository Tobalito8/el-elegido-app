const ChestSVG = ({ open, hasMoney, revealed, size = 80 }) => {
  const gold = hasMoney && revealed;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="40" cy="74" rx="28" ry="4" fill="rgba(0,0,0,0.4)" />
      <rect
        x="8"
        y="42"
        width="64"
        height="30"
        rx="5"
        fill={gold ? "#92400e" : "#374151"}
      />
      <rect
        x="8"
        y="42"
        width="64"
        height="30"
        rx="5"
        fill="none"
        stroke={gold ? "#fbbf24" : "#6b7280"}
        strokeWidth="2"
      />
      <rect
        x="8"
        y="53"
        width="64"
        height="8"
        fill={gold ? "#78350f" : "#1f2937"}
      />
      <rect
        x="32"
        y="50"
        width="16"
        height="14"
        rx="3"
        fill={gold ? "#fbbf24" : "#4b5563"}
      />
      <rect
        x="36"
        y="46"
        width="8"
        height="8"
        rx="4"
        fill="none"
        stroke={gold ? "#fbbf24" : "#6b7280"}
        strokeWidth="2.5"
      />
      <g
        style={{
          transformOrigin: "40px 42px",
          transform: open ? "rotate(-45deg)" : "rotate(0deg)",
          transition: "transform 0.5s",
        }}
      >
        <path
          d="M8 42 Q8 20 40 18 Q72 20 72 42 Z"
          fill={gold ? "#92400e" : "#374151"}
        />
        <path
          d="M8 42 Q8 20 40 18 Q72 20 72 42 Z"
          fill="none"
          stroke={gold ? "#fbbf24" : "#6b7280"}
          strokeWidth="2"
        />
        <path
          d="M8 33 Q40 30 72 33"
          stroke={gold ? "#78350f" : "#1f2937"}
          strokeWidth="6"
          fill="none"
        />
        {[20, 40, 60].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="38"
            r="3"
            fill={gold ? "#fbbf24" : "#6b7280"}
          />
        ))}
      </g>
      {gold && (
        <>
          <ellipse
            cx="40"
            cy="48"
            rx="14"
            ry="5"
            fill="#fbbf24"
            opacity="0.9"
          />
          <ellipse cx="35" cy="46" rx="5" ry="2.5" fill="#f59e0b" />
          <ellipse cx="45" cy="45" rx="5" ry="2.5" fill="#fbbf24" />
          <ellipse cx="40" cy="44" rx="6" ry="2.5" fill="#fde68a" />
        </>
      )}
    </svg>
  );
};

export default ChestSVG;
