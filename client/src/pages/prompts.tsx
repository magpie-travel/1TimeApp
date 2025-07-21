import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Lightbulb, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { MemoryPrompt } from '@shared/schema';

export default function Prompts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: prompts = [], isLoading } = useQuery<MemoryPrompt[]>({
    queryKey: ['/api/prompts', selectedCategory === 'all' ? undefined : selectedCategory],
    queryFn: async () => {
      const params = selectedCategory === 'all' ? '' : `?category=${selectedCategory}`;
      const response = await fetch(`/api/prompts${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/prompts/categories'],
    queryFn: async () => {
      const response = await fetch('/api/prompts/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  const generatePromptMutation = useMutation({
    mutationFn: async (category?: string) => {
      const response = await apiRequest('POST', '/api/prompts/generate', { category });
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/create?prompt=${encodeURIComponent(data.prompt)}`);
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePromptClick = (prompt: string) => {
    setLocation(`/create?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleGeneratePrompt = () => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    generatePromptMutation.mutate(category);
  };

  const categoryLabels: Record<string, string> = {
    childhood: 'Childhood',
    daily: 'Daily Life',
    relationships: 'Relationships',
    travel: 'Travel',
    achievements: 'Achievements',
    family: 'Family',
    work: 'Work',
    hobbies: 'Hobbies',
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, MemoryPrompt[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Memory Prompts</h2>
          <p className="text-gray-600 dark:text-gray-400">Need inspiration? Try one of these prompts to spark a memory.</p>
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="flex-shrink-0"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {categoryLabels[category] || category}
            </Button>
          ))}
        </div>

        {/* AI Prompt Generator */}
        <Card className="mb-6 bg-gradient-to-r from-secondary to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Surprise Me!
                </h3>
                <p className="text-purple-100 text-sm">Get an AI-generated prompt to explore</p>
              </div>
              <Button
                onClick={handleGeneratePrompt}
                disabled={generatePromptMutation.isPending}
                className="bg-white text-secondary hover:bg-purple-50"
              >
                {generatePromptMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Cards */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : selectedCategory === 'all' ? (
            // Show all categories
            Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
              <Card key={category}>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {categoryLabels[category] || category}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {categoryPrompts.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handlePromptClick(prompt.prompt)}
                        className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">"{prompt.prompt}"</p>
                      </button>
                    ))}
                    {categoryPrompts.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="w-full"
                      >
                        Show {categoryPrompts.length - 3} more...
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Show specific category
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {categoryLabels[selectedCategory] || selectedCategory}
                </h3>
                <div className="space-y-2">
                  {groupedPrompts[selectedCategory]?.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptClick(prompt.prompt)}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200">"{prompt.prompt}"</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prompts.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💡</div>
              <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try generating an AI prompt or selecting a different category
              </p>
              <Button onClick={handleGeneratePrompt} disabled={generatePromptMutation.isPending}>
                Generate AI Prompt
              </Button>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
