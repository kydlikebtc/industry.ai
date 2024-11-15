import Game from "@/components/Game";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-8">
      <Game userId={user?.id} walletAddress={user.primaryWeb3Wallet?.web3Wallet || ""} />
    </div>
  );
}
