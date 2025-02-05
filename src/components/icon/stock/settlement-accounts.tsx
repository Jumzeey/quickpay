import React from "react";

const SVG: React.FC<{ color: string }> = ({ color }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 22 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 1.58398L10 12.584"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 1.58398L14 21.584L10 12.584L1 8.58398L21 1.58398Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SVG;
