import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AudioPlayer } from '../components/audio-player';
import { Button } from '../components/ui/button';
import { MapPin, Calendar, Users, Mic, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Memory } from '@shared/schema';

export default function SharedMemory() {
  const { token } = useParams<{ token: string }>();

  const { data: memory, isLoading, error } = useQuery<Memory>({
    queryKey: ['/api/shared', token],
    queryFn: async () => {
      const response = await fetch(`/api/shared/${token}`);
      if (!response.ok) {
        throw new Error('Shared memory not found');
      }
      return response.json();
    },
    enabled: !!token,
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
      case 'happy': return 'bg-green-100 text-green-700';
      case 'sad': return 'bg-blue-100 text-blue-700';
      case 'grateful': return 'bg-purple-100 text-purple-700';
      case 'peaceful': return 'bg-indigo-100 text-indigo-700';
      case 'excited': return 'bg-orange-100 text-orange-700';
      case 'nostalgic': return 'bg-pink-100 text-pink-700';
      case 'anxious': return 'bg-red-100 text-red-700';
      case 'content': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared memory...</p>
        </div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Memory not found</h2>
          <p className="text-gray-600 mb-4">
            The shared memory you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Visit 1time.ai
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">1time.ai</h1>
          <p className="text-sm text-gray-600">A shared memory</p>
        </div>

        {/* Memory Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {formatDistanceToNow(new Date(memory.date), { addSuffix: true })}
                </span>
                {memory.emotion && (
                  <Badge className={`text-xs ${getEmotionColor(memory.emotion)}`}>
                    {getEmotionIcon(memory.emotion)} {memory.emotion}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
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
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-yellow-700 italic">
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
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-2 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  Auto-generated transcript
                </div>
                <div className="font-serif text-gray-800 leading-relaxed">
                  {memory.transcript}
                </div>
              </div>
            )}

            {memory.content && (
              <div className="font-serif text-gray-800 leading-relaxed text-lg mb-6">
                {memory.content}
              </div>
            )}

            {/* Memory Metadata */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {memory.people && memory.people.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">People</span>
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
                <span className="text-sm font-medium text-gray-600">Date</span>
                <span className="text-sm text-gray-500">
                  {new Date(memory.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Start Your Memory Journey</h3>
            <p className="text-purple-100 text-sm mb-4">
              Create and organize your own memories with 1time.ai
            </p>
            <Button 
              className="bg-white text-primary hover:bg-gray-50"
              onClick={() => window.location.href = '/auth'}
            >
              Get Started Free
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Powered by 1time.ai - Your Personal Memory Keeper</p>
        </div>
      </div>
    </div>
  );
}
