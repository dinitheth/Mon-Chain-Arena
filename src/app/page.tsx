import { Header } from '@/components/header';
import { GameClient } from '@/components/game-client';
import { MobileGate } from '@/components/mobile-gate';

export default function Home() {
  return (
    <MobileGate>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <GameClient />
        </main>
      </div>
    </MobileGate>
  );
}
