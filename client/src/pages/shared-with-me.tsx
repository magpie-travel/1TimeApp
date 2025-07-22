import { useQuery } from '@tanstack/react-query';
import { MemoryCard } from '../components/memory-card';
import { BottomNavigation } from '../components/bottom-navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../lib/auth';
import { Share2, ArrowLeft, Users } from 'lucide-react';
import { Link } from 'wouter';
import type { Memory } from '@shared/schema';

export default function SharedWithMe() {
  const { user } = useAuth();

  const { data: sharedMemories = [], isLoading, error } = useQuery<Memory[]>({
    queryKey: ['/api/shared-memories', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const response = await fetch(`/api/shared-memories?email=${encodeURIComponent(user.email)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shared memories');
      }
      return response.json();
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to view shared memories</p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">Shared with Me</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <Badge variant="secondary" className="text-xs">
                {sharedMemories.length}
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Header Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Memories Shared with You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These are memories that others have shared with you. You can view them but not edit unless given permission.
            </p>
          </CardContent>
        </Card>

        {/* Shared Memories List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">Failed to load shared memories</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Please try again later</p>
            </div>
          ) : sharedMemories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📤</div>
              <h3 className="text-lg font-semibold mb-2">No shared memories yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                When someone shares a memory with your email address, it will appear here.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>How it works:</strong> When someone tags you in a memory or shares it with your email, 
                  you'll be able to access it here after signing in.
                </p>
              </div>
            </div>
          ) : (
            sharedMemories.map((memory) => (
              <div key={memory.id} className="relative">
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="secondary" className="text-xs">
                    Shared
                  </Badge>
                </div>
                <MemoryCard memory={memory} />
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}