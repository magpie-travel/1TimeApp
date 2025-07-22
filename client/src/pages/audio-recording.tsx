import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { useAudioRecording } from '../hooks/use-audio-recording';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AudioPlayer } from '../components/audio-player';
import { useToast } from '../hooks/use-toast';
import { useLocation } from 'wouter';
import { ArrowLeft, Mic, Play, Pause, OctagonMinus, FileText, MapPin, Calendar } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import type { InsertMemory } from '@shared/schema';

export default function AudioRecording() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecording();

  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
  });

  const transcribeMutation = useMutation({
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
      setTranscript(data.text);
      setIsTranscribing(false);
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
      toast({ title: 'Audio memory created successfully!' });
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

  useEffect(() => {
    if (audioBlob && !isTranscribing) {
      setIsTranscribing(true);
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      transcribeMutation.mutate(audioFile);
    }
  }, [audioBlob]);

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleSave = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save memories',
        variant: 'destructive',
      });
      return;
    }

    if (!transcript.trim()) {
      toast({
        title: 'No content to save',
        description: 'Please record something first',
        variant: 'destructive',
      });
      return;
    }

    const memoryData: InsertMemory = {
      userId: user.id,
      type: 'audio',
      content: transcript,
      transcript: transcript,
      audioUrl: audioUrl || null,
      audioDuration: duration,
      people: [],
      location: formData.location || null,
      emotion: null,
      date: new Date(formData.date),
      prompt: null,
      isPublic: false,
      shareToken: null,
    };

    createMemoryMutation.mutate(memoryData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to record memories</p>
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
            onClick={() => setLocation('/create')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Audio Memory</h2>
          <Button
            onClick={handleSave}
            disabled={createMemoryMutation.isPending || !transcript}
            className="font-medium"
          >
            {createMemoryMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Recording Interface */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
                variant="ghost"
              >
                <Mic className="w-8 h-8 text-primary" />
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-105"
                variant="ghost"
              >
                <OctagonMinus className="w-8 h-8 text-white" />
              </Button>
            )}
          </div>
          
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            {isRecording ? 'Recording...' : 'Ready to record'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isRecording ? `${formatTime(duration)} - Tap the red stop button to finish` : 'Tap the microphone to start recording'}
          </p>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording...</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatTime(duration)}</span>
              </div>
              
              {/* Audio Waveform Visualization */}
              <div className="flex items-center justify-center space-x-1 mb-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-primary rounded-full transition-all duration-75 ${
                      isRecording ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: `${Math.random() * 30 + 15}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handlePauseRecording}
                  variant="outline"
                  size="sm"
                >
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  onClick={resetRecording}
                  variant="ghost"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcription Status */}
        {isTranscribing && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Transcribing audio...</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center">Using AI to convert your speech to text</p>
            </CardContent>
          </Card>
        )}

        {/* Playback and Transcript */}
        {audioUrl && (
          <div className="space-y-4">
            {/* New Recording Button */}
            <div className="text-center">
              <Button
                onClick={resetRecording}
                variant="outline"
                className="mb-4"
              >
                <Mic className="w-4 h-4 mr-2" />
                Record New Audio
              </Button>
            </div>

            {/* Audio Player */}
            <Card>
              <CardContent className="p-4">
                <AudioPlayer audioUrl={audioUrl} />
              </CardContent>
            </Card>

            {/* Transcript */}
            {transcript && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Transcript
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Edit
                    </Button>
                  </div>
                  <div className="font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
                    {transcript}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Memory Tags */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Tag your audio memory</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="location" className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Where?"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date" className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
