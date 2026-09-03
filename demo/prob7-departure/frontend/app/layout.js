import "./globals.css";

export const metadata = {
  title: "가짜 출항 신고서",
  description: "Hackahoy AI challenge - fake departure form",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
