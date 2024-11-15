import { Providers } from "@/providers/providers";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";

import CharacterSelect from '@/components/CharacterSelect';
import CreateCharacterButton from '@/components/CreateCharacterButton';
import { CharacterSelectProvider } from '@/contexts/CharacterSelectContext';
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Industry AI",
  description: "Industry AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} `}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[#EAEBED] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <ClerkProvider>
          <div className="mx-auto max-w-[1280px]">
            <Providers>
              <CharacterSelectProvider>
                <div className="flex justify-between items-center p-4">
                  <div>
                    <SignedOut>
                      <SignInButton />
                    </SignedOut>
                    <SignedIn>
                      <UserButton />
                    </SignedIn>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <span className="text-white font-bold text-xl">LOGO</span>
                    </div>
                  </div>
                  <CreateCharacterButton />
                </div>
                <CharacterSelect />
                {children}
              </CharacterSelectProvider>
            </Providers>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}

