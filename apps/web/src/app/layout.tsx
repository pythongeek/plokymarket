import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plokymarket App",
  description: "Prediction Market Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
