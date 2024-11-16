import CharacterSelect from '@/components/CharacterSelect';
import CreateCharacterButton from '@/components/CreateCharacterButton';
import { CharacterSelectProvider } from '@/contexts/CharacterSelectContext';
import { Providers } from "@/providers/providers";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from 'next/image';
import { inter } from './fonts';
import "./globals.css";

export const metadata: Metadata = {
  title: "Industry AI - ETHGlobal Bangkok Hackathon Project",
  description: "Industry AI is an ETHGlobal Bangkok Hackathon project exploring recursive agent inference and natural language interfaces. Experience a unified platform where AI agents interact, learn, and evolve through natural conversations while leveraging blockchain technology.",
  keywords: "ETHGlobal Bangkok, Hackathon, AI Agents, Recursive Inference, Natural Language Interface, Blockchain, Web3",
  openGraph: {
    title: "Industry AI - Recursive Agent Platform",
    description: "Explore the future of AI agent interactions through natural language on a unified blockchain platform. Built at ETHGlobal Bangkok.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Industry AI - ETHGlobal Bangkok",
    description: "Revolutionary platform for recursive AI agent interactions through natural language interfaces.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-hidden">
      <body
        className={`${inter.className} overflow-hidden`}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[#EAEBED] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <ClerkProvider>
          <div className="mx-auto max-w-[1280px] h-screen overflow-hidden">
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
                  <div className="absolute left-1/2 top-4 -translate-x-1/2">
                    <div className="flex items-center justify-center">
                      <Image
                        src="/logo_industry.png"
                        alt="Industry AI Logo"
                        width={180}
                        height={40}
                        priority
                      />
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

