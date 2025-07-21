import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/file-upload';
import { AudioPlayer } from '@/components/audio-player';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { ArrowLeft, Keyboard, Mic, Users, MapPin, Calendar, Heart, Camera, X, Image, Video, Paperclip, Play, Pause, Square, Loader2, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { InsertMemory } from '@shared/schema';

interface UploadedFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

interface MediaInspiration {
  files: UploadedFile[];
  inspiration: string;
}

export default function CreateMemory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCurrentLocation, reverseGeocode } = useGeolocation();

  const [memoryType, setMemoryType] = useState<'text' | 'audio' | 'mixed'>('mixed');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    people: [] as string[],
    location: '',
    emotion: '',
    date: new Date().toISOString().split('T')[0],
    prompt: '',
  });
  const [newPerson, setNewPerson] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [mediaInspiration, setMediaInspiration] = useState<MediaInspiration | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Audio recording hook
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error: audioError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();

  // Debug function to track attached files changes
  const handleFileUploaded = (files: UploadedFile[]) => {
    console.log('Files uploaded callback received:', files);
    console.log('Current location before setAttachedFiles:', window.location.href);
    console.log('Current form data before update:', formData);
    
    try {
      setAttachedFiles(files);
      console.log('setAttachedFiles completed successfully');
      
      // Also log the files to make sure they're being stored
      console.log('Attached files state will be updated to:', files);
      
      // Check if form is somehow being submitted
      if (createMemoryMutation.isPending) {
        console.warn('WARNING: createMemoryMutation is pending during file upload!');
      }
      
    } catch (error) {
      console.error('Error in setAttachedFiles:', error);
    }
    console.log('Current location after setAttachedFiles:', window.location.href);
  };

  // Load media inspiration from session storage
  useEffect(() => {
    const savedInspiration = sessionStorage.getItem('mediaInspiration');
    if (savedInspiration) {
      try {
        const inspiration = JSON.parse(savedInspiration) as MediaInspiration;
        setMediaInspiration(inspiration);
        setAttachedFiles(inspiration.files);
        if (inspiration.inspiration) {
          setFormData(prev => ({ ...prev, content: inspiration.inspiration }));
        }
        // Clear from session storage
        sessionStorage.removeItem('mediaInspiration');
      } catch (error) {
        console.error('Error loading media inspiration:', error);
      }
    }
  }, []);

  // Audio transcription mutation
  const transcribeAudioMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAudioTranscript(data.transcript);
      setIsTranscribing(false);
      toast({ title: 'Audio transcribed successfully!' });
    },
    onError: (error) => {
      setIsTranscribing(false);
      toast({
        title: 'Transcription failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData: InsertMemory) => {
      const response = await apiRequest('POST', '/api/memories', memoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({ title: 'Memory created successfully!' });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create memory',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create memories',
        variant: 'destructive',
      });
      return;
    }

    // Allow memories with just images/audio even without text content
    if (!formData.content.trim() && !formData.title.trim() && attachedFiles.length === 0 && !audioUrl) {
      toast({
        title: 'Content required',
        description: 'Please add some content, images, or audio to your memory',
        variant: 'destructive',
      });
      return;
    }

    console.log('Attached files at submit:', attachedFiles);
    console.log('Audio URL:', audioUrl);
    
    let finalAudioUrl = null;
    
    // Upload audio if it exists
    if (audioBlob) {
      try {
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalAudioUrl = uploadData.audioUrl;
        }
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }
    
    const memoryData: InsertMemory = {
      userId: user.id,
      type: audioUrl ? 'audio' : 'text',
      title: formData.title || null,
      content: formData.content || null,
      people: formData.people,
      location: formData.location || null,
      emotion: formData.emotion || null,
      date: new Date(formData.date),
      prompt: formData.prompt || null,
      transcript: audioTranscript || null,
      audioUrl: finalAudioUrl,
      audioDuration: duration,
      imageUrl: attachedFiles.find(f => f.type.startsWith('image/'))?.url || null,
      videoUrl: attachedFiles.find(f => f.type.startsWith('video/'))?.url || null,
      attachments: attachedFiles.map(f => f.url),
      isPublic: false,
      shareToken: null,
    };

    console.log('Memory data being sent:', memoryData);
    createMemoryMutation.mutate(memoryData);
  };

  const handleAddPerson = () => {
    if (newPerson.trim() && !formData.people.includes(newPerson.trim())) {
      setFormData(prev => ({
        ...prev,
        people: [...prev.people, newPerson.trim()],
      }));
      setNewPerson('');
    }
  };

  const handleRemovePerson = (person: string) => {
    setFormData(prev => ({
      ...prev,
      people: prev.people.filter(p => p !== person),
    }));
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      getCurrentLocation();
      
      // Use the geolocation hook's location state
      // Note: This is a simplified implementation - in a real app you'd properly handle the async location detection
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const locationName = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );
      
      setFormData(prev => ({ ...prev, location: locationName }));
      toast({ title: 'Location detected successfully!' });
    } catch (error) {
      toast({
        title: 'Location detection failed',
        description: 'Please enter your location manually',
        variant: 'destructive',
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleTranscribeAudio = () => {
    if (audioBlob) {
      setIsTranscribing(true);
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      transcribeAudioMutation.mutate(audioFile);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const emotions = [
    { value: 'happy', label: 'Happy', icon: '😊' },
    { value: 'sad', label: 'Sad', icon: '😢' },
    { value: 'grateful', label: 'Grateful', icon: '🙏' },
    { value: 'peaceful', label: 'Peaceful', icon: '☮️' },
    { value: 'excited', label: 'Excited', icon: '🎉' },
    { value: 'nostalgic', label: 'Nostalgic', icon: '💭' },
    { value: 'content', label: 'Content', icon: '😌' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to create memories</p>
          <Button onClick={() => setLocation('/auth')}>Sign In</Button>
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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">New Memory</h2>
          <Button
            onClick={() => handleSubmit()}
            disabled={createMemoryMutation.isPending}
            className="font-medium"
            type="button"
          >
            {createMemoryMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Memory Type Indicator */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Create Rich Memory
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add photos, audio, text, and more to capture your complete memory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Memory Title */}
          <div>
            <Label htmlFor="title">Memory Title (optional)</Label>
            <Input
              id="title"
              placeholder="Give your memory a title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-2"
            />
          </div>

          {/* Memory Content */}
          <div>
            <Label htmlFor="content">What's on your mind? (optional)</Label>
            <Textarea
              id="content"
              placeholder="Start writing your memory here..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="h-48 mt-2 font-serif resize-none"
            />
          </div>

          {/* Prompt Display */}
          {formData.prompt && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Prompt:</strong> "{formData.prompt}"
              </div>
            </div>
          )}

          {/* Media Inspiration Display */}
          {mediaInspiration && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Media Inspiration:</strong> Created from {mediaInspiration.files.length} uploaded file(s)
              </div>
            </div>
          )}

          {/* File Attachments */}
          <div>
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
              <Paperclip className="w-4 h-4 mr-1" />
              Attachments
            </Label>
            <FileUpload
              onFileUploaded={handleFileUploaded}
              multiple={true}
              accept="image/*,video/*"
              maxFiles={5}
              showPreview={true}
              className="mb-4"
            />
            {/* Debug info */}
            {attachedFiles.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <strong>DEBUG:</strong> {attachedFiles.length} file(s) attached
              </div>
            )}
            {attachedFiles.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {attachedFiles.length} file(s) attached
              </div>
            )}
          </div>

          {/* Audio Recording */}
          <div>
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
              <Mic className="w-4 h-4 mr-1" />
              Audio Recording
            </Label>
            
            <div className="space-y-3">
              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                {!isRecording && !audioUrl && (
                  <Button
                    type="button"
                    onClick={startRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </Button>
                )}
                
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      type="button"
                      onClick={stopRecording}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                    <span className="text-sm text-gray-500">
                      {formatDuration(duration)}
                    </span>
                  </div>
                )}
                
                {audioUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={resetRecording}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Delete
                    </Button>
                    <Button
                      type="button"
                      onClick={handleTranscribeAudio}
                      variant="outline"
                      disabled={isTranscribing}
                      className="flex items-center gap-2"
                    >
                      {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Audio Player */}
              {audioUrl && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <AudioPlayer audioUrl={audioUrl} />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Duration: {formatDuration(duration)}
                  </div>
                </div>
              )}
              
              {/* Transcript Display */}
              {audioTranscript && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    <strong>Transcript:</strong>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {audioTranscript}
                  </div>
                </div>
              )}
              
              {/* Audio Error */}
              {audioError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xs text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {audioError}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag your memory</h3>
            
            {/* People */}
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                <Users className="w-4 h-4 mr-1" />
                People
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.people.map((person) => (
                  <Badge key={person} variant="secondary" className="flex items-center gap-1">
                    {person}
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(person)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add people..."
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPerson();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddPerson} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Where did this happen?"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  variant="outline"
                >
                  {isDetectingLocation ? 'Detecting...' : '📍'}
                </Button>
              </div>
            </div>

            {/* Date */}
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                Date
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Emotion */}
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                <Heart className="w-4 h-4 mr-1" />
                How did you feel?
              </Label>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion) => (
                  <Button
                    key={emotion.value}
                    type="button"
                    variant={formData.emotion === emotion.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      emotion: prev.emotion === emotion.value ? '' : emotion.value
                    }))}
                  >
                    <span className="mr-1">{emotion.icon}</span>
                    {emotion.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Upload Placeholder */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a photo to your memory</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Feature coming soon</p>
          </div>
        </form>
      </div>
    </div>
  );
}
