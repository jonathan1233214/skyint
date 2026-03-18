import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "#00e5a0",
        "accent-dim": "#00b87d",
        "surface-1": "#0d1117",
        "surface-2": "#161b22",
        "surface-3": "#21262d",
        "surface-4": "#30363d",
        "border-subtle": "#30363d",
        "text-primary": "#e6edf3",
        "text-secondary": "#8b949e",
        "text-muted": "#484f58",
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
