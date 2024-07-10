// app/layout.jsx
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ThemeProvider } from 'next-themes';
import Navbar from '../components/Navbar';
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <UserProvider>
        <ThemeProvider attribute="class">
          <body className="flex flex-col h-screen">
            <Navbar className="z-10" />
            <main className="flex-grow overflow-auto">
              {children}
            </main>
          </body>
        </ThemeProvider>
      </UserProvider>
    </html>
  );
}