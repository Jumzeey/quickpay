

const SVG: React.FC<{ color: string }> = ({ color }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 1.22852H3C1.89543 1.22852 1 2.12395 1 3.22852V15.2285C1 16.3331 1.89543 17.2285 3 17.2285H21C22.1046 17.2285 23 16.3331 23 15.2285V3.22852C23 2.12395 22.1046 1.22852 21 1.22852Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 7.22852H23"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SVG;
