import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
    colors: {
      primary: "#042468",
      available: "#6147db",
      income: "#12B593",
      expenses: "#FF5555",
      white: "#fff",
      black: "#000",
      "grey-100": "#A0A0A0",
      "grey-200": "#D9D9D9",
      "grey-300": "#8C8C8C",
      "grey-400": "#3d3939",
      "grey-500": "#9499a1",
      danger: "#EB5757",
      disabled: "#eeeeee",
      success: "#27AE60",
    },
  },
  plugins: [],
};
export default config;
