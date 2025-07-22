import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { BottomNavigation } from '@/components/bottom-navigation';
import { MemoryCard } from '@/components/memory-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { Search as SearchIcon, Filter, Calendar, MapPin, Users, Heart, X, Sparkles, Lightbulb, Zap, Brain } from 'lucide-react';
import type { Memory } from '@shared/schema';

interface SemanticSearchResult {
  memory: Memory;
  similarity: number;
  explanation: string;
}

interface QueryExpansion {
  expandedQuery: string;
  searchTerms: string[];
  searchStrategy: string;
}

interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  queryExpansion: QueryExpansion;
  originalQuery: string;
  message: string;
}

export default function Search() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    emotion: '',
    location: '',
    people: '',
    dateRange: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('semantic');
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [queryExpansion, setQueryExpansion] = useState<QueryExpansion | null>(null);

  // Semantic search mutation
  const semanticSearchMutation = useMutation({
    mutationFn: async ({ query, userId }: { query: string; userId: string }) => {
      const response = await apiRequest<SemanticSearchResponse>('/api/memories/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId }),
      });
      return response;
    },
    onSuccess: (data) => {
      setSemanticResults(data.results);
      setQueryExpansion(data.queryExpansion);
    },
    onError: (error) => {
      console.error('Semantic search error:', error);
      setSemanticResults([]);
      setQueryExpansion(null);
    },
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger semantic search when query changes
  useEffect(() => {
    if (debouncedQuery && user && searchMode === 'semantic') {
      semanticSearchMutation.mutate({ query: debouncedQuery, userId: user.id });
    }
  }, [debouncedQuery, user, searchMode]);

  const { data: memories = [], isLoading, error } = useQuery<Memory[]>({
    queryKey: ['/api/memories', user?.id, 'search', debouncedQuery, filters],
    queryFn: async () => {
      if (!user) return [];
      
      const params = new URLSearchParams({
        userId: user.id,
      });
      
      if (debouncedQuery) {
        params.append('search', debouncedQuery);
      }
      
      if (filters.emotion) {
        params.append('emotion', filters.emotion);
      }
      
      if (filters.location) {
        params.append('location', filters.location);
      }
      
      if (filters.people) {
        params.append('people', filters.people);
      }
      
      const response = await fetch(`/api/memories?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search memories');
      }
      return response.json();
    },
    enabled: !!user && (!!debouncedQuery || Object.values(filters).some(f => f)),
  });

  const { data: recentMemories = [] } = useQuery<Memory[]>({
    queryKey: ['/api/memories', user?.id, 'recent'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/memories?userId=${user.id}&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent memories');
      }
      return response.json();
    },
    enabled: !!user && !debouncedQuery && !Object.values(filters).some(f => f),
  });

  const clearAllFilters = () => {
    setFilters({
      emotion: '',
      location: '',
      people: '',
      dateRange: '',
    });
    setSearchQuery('');
  };

  const removeFilter = (filterType: string) => {
    setFilters(prev => ({ ...prev, [filterType]: '' }));
  };

  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  const hasActiveFilters = activeFilters.length > 0 || searchQuery;

  const displayMemories = debouncedQuery || Object.values(filters).some(f => f) 
    ? memories 
    : recentMemories;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to search memories</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900">
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Search Memories
          </h1>
          
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={searchMode === 'semantic' ? "Ask anything about your memories..." : "Search your memories..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>

          <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as 'keyword' | 'semantic')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semantic" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Search
              </TabsTrigger>
              <TabsTrigger value="keyword" className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Keyword
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="semantic" className="mt-4">
              {queryExpansion && (
                <Alert className="mb-4">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Search Strategy: {queryExpansion.searchStrategy}</p>
                      <div className="flex flex-wrap gap-1">
                        {queryExpansion.searchTerms.map((term, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {semanticSearchMutation.isPending && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Analyzing your memories...</p>
                        <Progress value={undefined} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {semanticResults.length > 0 && (
                <div className="space-y-4">
                  {semanticResults.map((result, index) => (
                    <Card key={result.memory.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.similarity * 100)}% match
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            <strong>Why this matches:</strong> {result.explanation}
                          </p>
                        </div>
                        <MemoryCard memory={result.memory} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {!semanticSearchMutation.isPending && semanticResults.length === 0 && debouncedQuery && (
                <Card className="p-6 text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No relevant memories found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Try asking about different topics or experiences
                  </p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="keyword" className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                
                {(filters.emotion || filters.location || filters.people || filters.dateRange) && (
                  <Badge variant="secondary" className="text-xs">
                    {[filters.emotion, filters.location, filters.people, filters.dateRange]
                      .filter(Boolean).length} active
                  </Badge>
                )}
              </div>

              {showFilters && (
                <Card className="mb-4">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Emotion
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., happy, sad"
                          value={filters.emotion}
                          onChange={(e) => setFilters({ ...filters, emotion: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Location
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., New York"
                          value={filters.location}
                          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          People
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., John, Mary"
                          value={filters.people}
                          onChange={(e) => setFilters({ ...filters, people: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Date Range
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., 2023"
                          value={filters.dateRange}
                          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ emotion: '', location: '', people: '', dateRange: '' })}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && memories && memories.length === 0 && debouncedQuery && (
                <Card className="p-6 text-center">
                  <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No memories found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </Card>
              )}

              {!isLoading && memories && memories.length > 0 && (
                <div className="space-y-4">
                  {memories.map((memory) => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {!debouncedQuery && !isLoading && (
            <Card className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                {searchMode === 'semantic' ? (
                  <Brain className="h-12 w-12 text-blue-500" />
                ) : (
                  <SearchIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchMode === 'semantic' 
                  ? "Ask AI anything about your memories" 
                  : "Start typing to search your memories"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {searchMode === 'semantic' 
                  ? "Try: 'Show me happy moments with friends' or 'What did I do last summer?'"
                  : "Search by content, people, locations, or emotions"}
              </p>
            </Card>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
