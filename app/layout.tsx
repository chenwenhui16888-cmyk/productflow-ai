import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProductFlow AI",
  description: "面向初级产品经理的 AI 产品研发助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
