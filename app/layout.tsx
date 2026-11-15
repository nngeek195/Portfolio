import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Saira_Extra_Condensed, Saira_Stencil } from "next/font/google";
import "./globals.css";

// Typography (see globals.css @theme):
//   display  – Saira Extra Condensed: tall, tactical headings
//   stencil  – Saira Stencil: section codes and stamps only
//   sans     – Inter: body copy
//   mono     – JetBrains Mono: HUD readouts, labels, metadata
const display = Saira_Extra_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-face",
});
// No metric overrides exist for Saira Stencil, so skip the size-adjusted fallback (used for short labels only).
const stencil = Saira_Stencil({ subsets: ["latin"], variable: "--font-stencil-face", adjustFontFallback: false });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-face" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: {
    default: "Niranga Nayanajith — Developer & Cybersecurity",
    template: "%s | Niranga Nayanajith",
  },
  description:
    "Portfolio of Niranga Nayanajith, a developer and cybersecurity enthusiast at the Faculty of Computing, Sabaragamuwa University of Sri Lanka.",
};

export const viewport: Viewport = {
  themeColor: "#0C0E11",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      // The public site's boot preloader script sets data-boot on <html> before hydration.
      suppressHydrationWarning
      lang="en"
      className={`${display.variable} ${stencil.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
