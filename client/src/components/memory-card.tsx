import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Users, Mic, FileText, MoreHorizontal, Edit, Trash2, Share2, Image, Video } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { AudioPlayer } from './audio-player';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import type { Memory } from '@shared/schema';

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      await apiRequest(`/api/memories/${memoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({
        title: 'Memory deleted',
        description: 'Your memory has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete memory. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = () => {
    setLocation(`/edit-memory/${memory.id}`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      deleteMutation.mutate(memory.id);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${memory.shareToken || memory.id}`);
    toast({
      title: 'Link copied',
      description: 'Memory link has been copied to clipboard.',
    });
  };

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

  // Parse attachments from JSON strings
  const parsedAttachments = memory.attachments
    ? memory.attachments.map(attachment => {
        if (typeof attachment === 'string') {
          try {
            return JSON.parse(attachment);
          } catch (e) {
            console.error('Failed to parse attachment:', attachment);
            return null;
          }
        }
        return attachment;
      }).filter(Boolean)
    : [];

  // Debug logging
  console.log('Memory:', memory.id, 'Attachments:', memory.attachments);
  console.log('Parsed attachments:', parsedAttachments);

  return (
    <Card className="memory-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(memory.date), { addSuffix: true })}
              </span>
              {memory.emotion && (
                <Badge className={`text-xs ${getEmotionColor(memory.emotion)}`}>
                  {getEmotionIcon(memory.emotion)} {memory.emotion}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {/* Show media type indicators based on content */}
              {memory.audioUrl && (
                <>
                  <Mic size={12} />
                  <span>Audio</span>
                  {memory.audioDuration && (
                    <span>• {Math.floor(memory.audioDuration / 60)}:{(memory.audioDuration % 60).toString().padStart(2, '0')}</span>
                  )}
                </>
              )}
              {(memory.imageUrl || (parsedAttachments && parsedAttachments.length > 0 && parsedAttachments.some(att => att.type?.startsWith('image/')))) && (
                <>
                  <Image size={12} />
                  <span>Photo</span>
                </>
              )}
              {(memory.videoUrl || (parsedAttachments && parsedAttachments.length > 0 && parsedAttachments.some(att => att.type?.startsWith('video/')))) && (
                <>
                  <Video size={12} />
                  <span>Video</span>
                </>
              )}
              {memory.content && (
                <>
                  <FileText size={12} />
                  <span>Text</span>
                </>
              )}
              {memory.location && (
                <>
                  <MapPin size={12} />
                  <span>{memory.location}</span>
                </>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit size={16} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                <Trash2 size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Memory Title */}
        {memory.title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {memory.title}
          </h3>
        )}

        {memory.prompt && (
          <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-xs text-yellow-700 dark:text-yellow-300 italic">
              Prompt: "{memory.prompt}"
            </div>
          </div>
        )}

        {memory.type === 'audio' && memory.audioUrl && (
          <div className="mb-3">
            <AudioPlayer audioUrl={memory.audioUrl} />
          </div>
        )}

        {/* Media Attachments - Facebook-style */}
        {(memory.imageUrl || memory.videoUrl || (parsedAttachments && parsedAttachments.length > 0)) && (
          <div className="mb-3 -mx-4">
            {memory.imageUrl && (
              <div className="mb-2">
                <img 
                  src={memory.imageUrl} 
                  alt="Memory attachment" 
                  className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(memory.imageUrl, '_blank')}
                  onError={(e) => {
                    console.error('Image failed to load:', memory.imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {/* Show images from attachments if imageUrl is not available */}
            {!memory.imageUrl && parsedAttachments && parsedAttachments.length > 0 && (
              <div className="mb-2">
                {parsedAttachments
                  .filter(attachment => attachment.type?.startsWith('image/'))
                  .map((attachment, index) => (
                    <img 
                      key={index}
                      src={attachment.url} 
                      alt="Memory attachment" 
                      className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity mb-2"
                      onClick={() => window.open(attachment.url, '_blank')}
                      onError={(e) => {
                        console.error('Attachment image failed to load:', attachment.url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                {parsedAttachments
                  .filter(attachment => attachment.type?.startsWith('video/'))
                  .map((attachment, index) => (
                    <video 
                      key={index}
                      src={attachment.url} 
                      controls
                      className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity mb-2"
                      onError={(e) => {
                        console.error('Attachment video failed to load:', attachment.url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
              </div>
            )}
            {memory.videoUrl && (
              <div className="mb-2">
                <video 
                  src={memory.videoUrl} 
                  controls 
                  className="w-full max-h-80 object-cover"
                  preload="metadata"
                />
              </div>
            )}
          </div>
        )}

        {memory.transcript && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <FileText size={12} className="mr-1" />
              Auto-generated transcript
            </div>
            <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
              {memory.transcript}
            </div>
          </div>
        )}

        {memory.content && (
          <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
            {memory.content.length > 150 ? `${memory.content.substring(0, 150)}...` : memory.content}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {memory.people && memory.people.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{memory.people.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{new Date(memory.date).toLocaleDateString()}</span>
            </div>
          </div>
          <Link href={`/memory/${memory.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
