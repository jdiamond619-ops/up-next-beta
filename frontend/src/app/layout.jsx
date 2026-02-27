import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Up Next Beta",
  description: "Closed-loop UNC backing economy for social videos"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
