import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { BottomNavigation } from '../components/bottom-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { useLocation } from 'wouter';
import { User, Settings, Download, Trash2, LogOut, Edit2, Mail, Calendar, BarChart3 } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import type { Memory } from '@shared/schema';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const { data: memories = [] } = useQuery<Memory[]>({
    queryKey: ['/api/memories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/memories?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
      setIsEditing(false);
      toast({ title: 'Profile updated successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/auth');
    } catch (error) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportData = () => {
    const data = {
      user: {
        name: user?.name,
        email: user?.email,
        joinDate: user?.createdAt,
      },
      memories: memories.map(memory => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        transcript: memory.transcript,
        people: memory.people,
        location: memory.location,
        emotion: memory.emotion,
        date: memory.date,
        prompt: memory.prompt,
        createdAt: memory.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1time-ai-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Data exported successfully!' });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your memories.')) {
      toast({
        title: 'Account deletion',
        description: 'This feature is not implemented yet',
        variant: 'destructive',
      });
    }
  };

  const getMemoryStats = () => {
    const textMemories = memories.filter(m => m.type === 'text').length;
    const audioMemories = memories.filter(m => m.type === 'audio').length;
    const totalWords = memories.reduce((sum, m) => sum + (m.content?.split(' ').length || 0), 0);
    const emotionCounts = memories.reduce((acc, m) => {
      if (m.emotion) {
        acc[m.emotion] = (acc[m.emotion] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topEmotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0];
    
    return {
      total: memories.length,
      textMemories,
      audioMemories,
      totalWords,
      topEmotion: topEmotion ? topEmotion[0] : null,
    };
  };

  const stats = getMemoryStats();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to view your profile</p>
          <Button onClick={() => setLocation('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
            {user.name || 'User'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Profile Information
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Your email"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.name || 'No name set'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Your Memory Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Memories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{stats.totalWords}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Words Written</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Text memories</span>
                <span className="text-sm font-medium">{stats.textMemories}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Audio memories</span>
                <span className="text-sm font-medium">{stats.audioMemories}</span>
              </div>
              {stats.topEmotion && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Most common emotion</span>
                  <span className="text-sm font-medium capitalize">{stats.topEmotion}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            
            <Separator />
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-primary mb-2">1time.ai</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your Personal Memory Keeper
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Version 1.0.0
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
