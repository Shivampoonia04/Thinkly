import './globals.css';

export const metadata = {
  title: 'Thinkly Labs — Secure Code Companion',
  description: 'A topic-focused cybersecurity chatbot for developers with sources.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

