// app/layout.tsx

export const metadata = {
  title: "Hackahoy Chatbot",
  description: "Welcome to Cotton Candy Island",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
