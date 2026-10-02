import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#D6001C",
          redDark: "#A5001A",
          blue: "#0033A0",
          yellow: "#FFC72C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
