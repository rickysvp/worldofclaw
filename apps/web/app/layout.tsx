import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claw World 控制台",
  description: "一个能让用户看见自己的 OpenClaw 正在世界里活着，并处理关键决策卡的最小前端入口。"
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{props.children}</body>
    </html>
  );
}
