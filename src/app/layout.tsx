import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design Challenge Coach',
  description: 'Practice product design interviews with AI coaching and whiteboarding',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
