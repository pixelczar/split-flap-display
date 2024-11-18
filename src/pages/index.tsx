import localFont from "next/font/local";
import SplitFlapDisplay from "../../components/split-flap-display";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff", 
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex items-center justify-center font-[family-name:var(--font-geist-sans)]`}
    >
      <main>
        <SplitFlapDisplay />
      </main>
    </div>
  );
}
