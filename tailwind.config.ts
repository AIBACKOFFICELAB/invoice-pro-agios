import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        agios: {
          obsidian: "#07111F",
          "obsidian-card": "#0C1729",
          "obsidian-border": "#1E293B",
          navy: "#0F172A",
          blue: "#2563EB",
          "blue-glow": "#3B82F6",
          cyan: "#38BDF8",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#EF4444",
        },
        field: {
          canvas: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          text: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};

export default config;
