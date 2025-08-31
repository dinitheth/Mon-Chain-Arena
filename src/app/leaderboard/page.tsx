import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeaderboard } from '@/lib/blockchain';
import { Header } from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 py-10">
        <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-headline">
              <Crown className="text-accent" />
              On-Chain Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((player, index) => (
                  <TableRow key={player.address}>
                    <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-code">
                        {`${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-500 font-bold">{player.kills}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
