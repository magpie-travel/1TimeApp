import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AudioPlayer } from '../components/audio-player';
import { MemorySharing } from '../components/memory-sharing';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Share2, Edit, MoreHorizontal, Link, Mail, Download, FileText, MapPin, Calendar, Users, Mic } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '../lib/queryClient';
import { useState } from 'react';
import type { Memory } from '@shared/schema';

export default function MemoryDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSharing, setShowSharing] = useState(false);

  const { data: memory, isLoading, error } = useQuery<Memory>({
    queryKey: ['/api/memories', id],
    queryFn: async () => {
      const response = await fetch(`/api/memories/${id}`);
      if (!response.ok) {
        throw new Error('Memory not found');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const shareMemoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/memories/${id}/share`);
      return response.json();
    },
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/shared/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Share link copied to clipboard!' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create share link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/memories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({ title: 'Memory deleted successfully' });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete memory',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'grateful': return '🙏';
      case 'peaceful': return '☮️';
      case 'excited': return '🎉';
      case 'nostalgic': return '💭';
      case 'anxious': return '😰';
      case 'content': return '😌';
      default: return '💭';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'sad': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'grateful': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'peaceful': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
      case 'excited': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'nostalgic': return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'anxious': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'content': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleShare = () => {
    setShowSharing(!showSharing);
  };

  const handleEdit = () => {
    setLocation(`/create?edit=${id}`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      deleteMemoryMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Memory not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The memory you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => setLocation('/')}>Back to Timeline</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={shareMemoryMutation.isPending}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMemoryMutation.isPending}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Memory Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(memory.date), { addSuffix: true })}
                </span>
                {memory.emotion && (
                  <Badge className={`text-xs ${getEmotionColor(memory.emotion)}`}>
                    {getEmotionIcon(memory.emotion)} {memory.emotion}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                {memory.type === 'audio' && (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Audio Memory</span>
                    {memory.audioDuration && (
                      <span>• {Math.floor(memory.audioDuration / 60)}:{(memory.audioDuration % 60).toString().padStart(2, '0')}</span>
                    )}
                  </>
                )}
                {memory.type === 'text' && (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Text Memory</span>
                  </>
                )}
                {memory.location && (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>{memory.location}</span>
                  </>
                )}
              </div>
            </div>

            {memory.prompt && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-sm text-yellow-700 dark:text-yellow-300 italic">
                  <strong>Prompt:</strong> "{memory.prompt}"
                </div>
              </div>
            )}

            {memory.type === 'audio' && memory.audioUrl && (
              <div className="mb-4">
                <AudioPlayer audioUrl={memory.audioUrl} />
              </div>
            )}

            {memory.transcript && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  Auto-generated transcript
                </div>
                <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                  {memory.transcript}
                </div>
              </div>
            )}

            {memory.content && (
              <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-lg mb-6">
                {memory.content}
              </div>
            )}

            {/* Memory Metadata */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {memory.people && memory.people.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">People</span>
                  <div className="flex items-center space-x-2">
                    {memory.people.map((person) => (
                      <Badge key={person} variant="secondary" className="text-xs">
                        {person}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Word count</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {memory.content.split(' ').length} words
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sharing Component */}
        {showSharing && (
          <div className="mb-6">
            <MemorySharing
              memoryId={memory.id}
              currentVisibility={memory.visibility || 'private'}
              onVisibilityChange={(visibility) => {
                // Update local state if needed
                console.log('Visibility changed to:', visibility);
              }}
            />
          </div>
        )}

        {/* Quick Share Options */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Share this memory</h3>
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {showSharing ? 'Hide sharing options' : 'Show sharing options'}
                  </span>
                </div>
                <div className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Memory from ${new Date(memory.date).toLocaleDateString()}`);
                  const body = encodeURIComponent(`Check out this memory:\n\n${memory.content}\n\nShared from 1time.ai`);
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Send via email</span>
                </div>
                <div className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  const content = `${memory.content}\n\nCreated: ${new Date(memory.date).toLocaleDateString()}\n${memory.location ? `Location: ${memory.location}\n` : ''}${memory.people?.length ? `People: ${memory.people.join(', ')}\n` : ''}`;
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `memory-${new Date(memory.date).toISOString().split('T')[0]}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Export as text</span>
                </div>
                <div className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
