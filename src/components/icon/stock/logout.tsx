import React from "react";

const SVG:React.FC<{ color: string }> = ({ color }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2V10.4593M18.1538 4.12251C19.7952 5.40357 20.9955 7.16491 21.5874 9.16075C22.1794 11.1566 22.1333 13.2874 21.4558 15.2558C20.7782 17.2243 19.5029 18.9321 17.8077 20.1411C16.1126 21.3502 14.0823 22 12 22C9.91772 22 7.88737 21.3502 6.19226 20.1411C4.49714 18.9321 3.22182 17.2243 2.54424 15.2558C1.86666 13.2874 1.82062 11.1566 2.41255 9.16075C3.00448 7.16491 4.20484 5.40357 5.84615 4.12251"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SVG;
