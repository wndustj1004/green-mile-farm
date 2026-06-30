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
        background: "var(--background)",
        foreground: "var(--foreground)",
        gm: {
          green: "#2f5d3c",
          leaf: "#4f8d61",
          cream: "#fbfaf6",
          cream2: "#f4f3ed",
          sage: "#eef1e8",
          fill: "#e6ede0",
          line: "#ecebe4",
          ink: "#222720",
          ink2: "#2a3327",
          body: "#525848",
          muted: "#646a5e",
          muted2: "#8a9279",
          tomato: "#df6650",
        },
      },
    },
  },
  plugins: [],
};
export default config;
