import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: "#0d5c2e",
        feltLight: "#127a3d",
        card: "#fafafa",
        gold: "#fbbf24",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
