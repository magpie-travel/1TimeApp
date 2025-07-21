import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemoryCard } from "@/components/memory-card";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import {
  Heart,
  MapPin,
  Users,
  Search,
  User,
  Bell,
  Share2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import type { Memory } from "@shared/schema";

export default function Timeline() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  const {
    data: memories = [],
    isLoading,
    error,
  } = useQuery<Memory[]>({
    queryKey: ["/api/memories", user?.id, activeFilter, searchQuery],
    queryFn: async () => {
      if (!user) return [];

      const params = new URLSearchParams({
        userId: user.id,
      });

      if (activeFilter !== "all") {
        if (activeFilter === "location") {
          params.append("location", "");
        } else {
          params.append("emotion", activeFilter);
        }
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/memories?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Query for shared memories to show notifications
  const { data: sharedMemories = [], isLoading: isLoadingShared } = useQuery<
    Memory[]
  >({
    queryKey: ["/api/shared-memories", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const response = await fetch(
        `/api/shared-memories?email=${encodeURIComponent(user.email)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch shared memories");
      }
      return response.json();
    },
    enabled: !!user?.email,
  });

  // Show notification when new shared memories are available
  useEffect(() => {
    if (sharedMemories.length > 0) {
      setShowNotification(true);
    }
  }, [sharedMemories.length]);

  const filters = [
    { id: "all", label: "All", icon: null },
    { id: "happy", label: "Happy", icon: Heart, color: "text-red-500" },
    { id: "location", label: "Location", icon: MapPin, color: "text-blue-500" },
    { id: "people", label: "People", icon: Users, color: "text-green-500" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be signed in to view your memories
          </p>
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
              <h1 className="text-xl font-bold text-primary">1time.ai</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <Link href="/profile">
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Shared Memory Notification */}
      {showNotification && sharedMemories.length > 0 && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-blue-800 dark:text-blue-200">
                  {sharedMemories.length} new shared memor
                  {sharedMemories.length === 1 ? "y" : "ies"}
                </strong>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Someone shared memories with you
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/shared-with-me">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotification(false)}
                  className="text-blue-600 hover:bg-blue-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search your memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                className="flex-shrink-0"
              >
                {Icon && <Icon className={`w-4 h-4 mr-1 ${filter.color}`} />}
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Memory Prompt Generator */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">
                Need inspiration?
              </h3>
              <p className="text-green-100 text-sm">
                Get a writing prompt to spark your memory
              </p>
            </div>
            <Link href="/prompts">
              <Button className="bg-white text-green-700 hover:bg-green-50">
                <span className="mr-1">💡</span>
                Inspire Me
              </Button>
            </Link>
          </div>
        </div>

        {/* Memory Timeline */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3"
              >
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
              <p className="text-red-500 dark:text-red-400">
                Failed to load memories
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Please try again later
              </p>
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No memories yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || activeFilter !== "all"
                  ? "No memories match your current filter"
                  : "Start creating your first memory to begin your journey"}
              </p>
              <Link href="/create">
                <Button>Create Your First Memory</Button>
              </Link>
            </div>
          ) : (
            memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))
          )}
        </div>
      </div>

      <FloatingActionButton />
      <BottomNavigation />
    </div>
  );
}
