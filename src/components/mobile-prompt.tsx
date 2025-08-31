'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Monitor } from 'lucide-react';

export function MobilePrompt() {
  return (
    <div className="container mx-auto flex h-[calc(100vh-57px)] items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Monitor className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Desktop Experience Recommended</CardTitle>
          <CardDescription>
            Chain Arena is designed for desktop. Please switch to a desktop browser for the best gameplay experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Mobile controls are coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
