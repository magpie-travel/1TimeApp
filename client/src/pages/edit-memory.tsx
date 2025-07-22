import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { FileUpload } from '../components/file-upload';
import { AudioPlayer } from '../components/audio-player';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { ArrowLeft, Save, Loader2, X, Plus } from 'lucide-react';
import type { Memory, InsertMemory } from '@shared/schema';

interface UploadedFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export default function EditMemory() {
  const [, params] = useRoute('/edit-memory/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('');
  const [location, setLocationValue] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const emotions = [
    { value: 'happy', label: 'Happy', color: 'bg-green-100 text-green-700' },
    { value: 'sad', label: 'Sad', color: 'bg-blue-100 text-blue-700' },
    { value: 'grateful', label: 'Grateful', color: 'bg-purple-100 text-purple-700' },
    { value: 'excited', label: 'Excited', color: 'bg-orange-100 text-orange-700' },
    { value: 'peaceful', label: 'Peaceful', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'nostalgic', label: 'Nostalgic', color: 'bg-pink-100 text-pink-700' },
    { value: 'content', label: 'Content', color: 'bg-teal-100 text-teal-700' },
    { value: 'anxious', label: 'Anxious', color: 'bg-red-100 text-red-700' },
  ];

  // Fetch the memory data
  const { data: memory, isLoading, error } = useQuery<Memory>({
    queryKey: ['/api/memories', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('Memory ID is required');
      const response = await fetch(`/api/memories/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch memory');
      return response.json();
    },
    enabled: !!params?.id,
  });

  // Update form state when memory data loads
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setContent(memory.content || '');
      setEmotion(memory.emotion || '');
      setLocationValue(memory.location || '');
      setPeople(memory.people || []);
      
      // Handle existing images
      if (memory.imageUrl) {
        setUploadedFiles([{
          url: memory.imageUrl,
          type: 'image/jpeg',
          name: 'existing-image.jpg',
          size: 0
        }]);
      }
    }
  }, [memory]);

  const updateMutation = useMutation({
    mutationFn: async (memoryData: Partial<InsertMemory>) => {
      if (!params?.id) throw new Error('Memory ID is required');
      return apiRequest(`/api/memories/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(memoryData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({
        title: 'Memory updated',
        description: 'Your memory has been successfully updated.',
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update memory. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() && !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a title or content for your memory.',
        variant: 'destructive',
      });
      return;
    }

    const memoryData: Partial<InsertMemory> = {
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      emotion: emotion || undefined,
      location: location.trim() || undefined,
      people: people.length > 0 ? people : undefined,
      imageUrl: uploadedFiles.length > 0 ? uploadedFiles[0].url : undefined,
    };

    updateMutation.mutate(memoryData);
  };

  const addPerson = () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      setPeople([...people, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (person: string) => {
    setPeople(people.filter(p => p !== person));
  };

  const handleFileUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timeline
          </Button>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Memory not found or failed to load.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Timeline
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Edit Memory</span>
              {memory.type === 'audio' && (
                <Badge variant="secondary">Audio</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audio player for audio memories */}
              {memory.type === 'audio' && memory.audioUrl && (
                <div>
                  <Label>Audio Recording</Label>
                  <div className="mt-2">
                    <AudioPlayer audioUrl={memory.audioUrl} />
                  </div>
                </div>
              )}

              {/* Auto-generated transcript */}
              {memory.transcript && (
                <div>
                  <Label>Auto-generated Transcript</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {memory.transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your memory a title..."
                  className="mt-2"
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What happened? How did it make you feel?"
                  className="mt-2 min-h-32"
                />
              </div>

              {/* Image Upload */}
              <div>
                <Label>Images</Label>
                <div className="mt-2">
                  <FileUpload
                    onFileUploaded={handleFileUploaded}
                    multiple={false}
                    accept="image/*"
                    showPreview={true}
                  />
                </div>
              </div>

              {/* Emotion */}
              <div>
                <Label>How are you feeling?</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {emotions.map((emotionOption) => (
                    <Badge
                      key={emotionOption.value}
                      variant={emotion === emotionOption.value ? "default" : "secondary"}
                      className={`cursor-pointer ${
                        emotion === emotionOption.value ? '' : emotionOption.color
                      }`}
                      onClick={() => setEmotion(emotionOption.value)}
                    >
                      {emotionOption.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="Where did this happen?"
                  className="mt-2"
                />
              </div>

              {/* People */}
              <div>
                <Label>People involved</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newPerson}
                      onChange={(e) => setNewPerson(e.target.value)}
                      placeholder="Add a person..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPerson();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPerson}
                      disabled={!newPerson.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {people.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {people.map((person) => (
                        <Badge
                          key={person}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removePerson(person)}
                        >
                          {person}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Memory
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}