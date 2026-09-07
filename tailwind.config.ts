import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1425",
        surface: "#1A2338",
        line: "#2C3854",
        paper: "#F2EEE3",
        muted: "#8C9AB8",
        gold: "#E8C56A",
        a1: "#E23E57",
        a2: "#2D8CF0",
        a3: "#F5A623",
        a4: "#22B573",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
