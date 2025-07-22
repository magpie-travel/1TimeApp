import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { InsertMemory } from "@shared/schema";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  ArrowLeft,
  Image as ImageIcon,
  Type,
  Mic,
  Upload,
  Play,
  Pause,
  Square,
  Trash2,
  MapPin,
  Users,
  Tag,
  X,
} from "lucide-react";

interface UploadedFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

type MemoryType = "image" | "text" | "audio";

interface FormData {
  type: MemoryType;
  title: string;
  content: string;
  people: string[];
  location: string;
  tags: string[];
  attachments: UploadedFile[];
  audioUrl: string | null;
  audioTranscript: string;
}

export default function CreateMemorySimple() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { location: userLocation } = useGeolocation();

  const [formData, setFormData] = useState<FormData>({
    type: "text",
    title: "",
    content: "",
    people: [],
    location: "",
    tags: [],
    attachments: [],
    audioUrl: null,
    audioTranscript: "",
  });

  const [newTag, setNewTag] = useState("");
  const [newPerson, setNewPerson] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await fetch("/api/upload/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        type: "image",
        attachments: [...prev.attachments, ...data.files],
      }));
      toast({
        title: "Files uploaded successfully!",
        description: `${data.files.length} file(s) uploaded`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Audio transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        audioTranscript: data.text || data.transcript,
        content: prev.content || data.text || data.transcript,
      }));
      setIsTranscribing(false);
      toast({ title: "Audio transcribed successfully!" });
    },
    onError: (error) => {
      setIsTranscribing(false);
      toast({
        title: "Transcription failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData: InsertMemory) => {
      const response = await apiRequest("POST", "/api/memories", memoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({ title: "Memory created successfully!" });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to create memory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle audio recording completion
  useEffect(() => {
    if (audioBlob && formData.type === "audio" && !formData.audioUrl) {
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });

      // Upload audio file
      const audioFormData = new FormData();
      audioFormData.append("audio", audioFile);

      fetch("/api/upload-audio", {
        method: "POST",
        body: audioFormData,
      })
        .then((response) => response.json())
        .then((data) => {
          setFormData((prev) => ({
            ...prev,
            audioUrl: data.audioUrl,
          }));

          // Start transcription
          setIsTranscribing(true);
          transcribeMutation.mutate(audioFile);
        })
        .catch((error) => {
          console.error("Audio upload failed:", error);
          toast({
            title: "Audio upload failed",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  }, [audioBlob, formData.type, formData.audioUrl, transcribeMutation, toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      uploadMutation.mutate(files);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addPerson = () => {
    if (newPerson.trim() && !formData.people.includes(newPerson.trim())) {
      setFormData((prev) => ({
        ...prev,
        people: [...prev.people, newPerson.trim()],
      }));
      setNewPerson("");
    }
  };

  const removePerson = (personToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      people: prev.people.filter((person) => person !== personToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create memories",
        variant: "destructive",
      });
      return;
    }

    // Validate required content
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your memory",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "text" && !formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your memory",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "image" && formData.attachments.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "audio" && !formData.audioUrl) {
      toast({
        title: "Audio required",
        description: "Please record an audio message",
        variant: "destructive",
      });
      return;
    }

    const memoryData: InsertMemory = {
      userId: user.id,
      type: formData.type,
      title: formData.title,
      content: formData.content,
      people: formData.people,
      location: formData.location,
      tags: formData.tags,
      attachments: formData.attachments,
      audioUrl: formData.audioUrl,
      audioTranscript: formData.audioTranscript,
      date: new Date(),
      createdAt: new Date(),
    };

    createMemoryMutation.mutate(memoryData);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold">Add Memory</h1>
        <div className="w-16" />
      </div>

      {/* Memory Type Selection */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={formData.type === "image" ? "default" : "outline"}
          onClick={() => {
            setFormData((prev) => ({ ...prev, type: "image" }));
            document.getElementById("file-upload")?.click();
          }}
          className="flex flex-col items-center p-6 h-auto"
        >
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">Photos</span>
        </Button>

        <Button
          variant={formData.type === "text" ? "default" : "outline"}
          onClick={() => setFormData((prev) => ({ ...prev, type: "text" }))}
          className="flex flex-col items-center p-6 h-auto"
        >
          <Type className="w-8 h-8 mb-2" />
          <span className="text-sm">Text</span>
        </Button>

        <Button
          variant={formData.type === "audio" ? "default" : "outline"}
          onClick={() => {
            setFormData((prev) => ({ ...prev, type: "audio" }));
            if (!isRecording) {
              startRecording();
            }
          }}
          className={`flex flex-col items-center p-6 h-auto ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`}
        >
          <Mic
            className={`w-8 h-8 mb-2 ${isRecording ? "animate-pulse text-white" : ""}`}
          />
          <span className={`text-sm ${isRecording ? "text-white" : ""}`}>
            {isRecording ? "Recording..." : "Audio"}
          </span>
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content based on type */}
        {formData.type === "image" && (
          <div className="space-y-4">
            <Label>Photos & Videos</Label>
            {formData.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={file.url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter(
                            (_, i) => i !== index,
                          ),
                        }));
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Click the Photos button above to upload
                </p>
              </div>
            )}
            {formData.attachments.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add More Files
              </Button>
            )}

            {/* Text area for image descriptions */}
            <div>
              <Label htmlFor="image-content">Caption or Description</Label>
              <Textarea
                id="image-content"
                placeholder="Add a caption or description for your photos/videos..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className="h-24 mt-2 font-serif resize-none"
              />
            </div>
          </div>
        )}

        {formData.type === "text" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Your Memory</Label>
              <Textarea
                id="content"
                placeholder="Write your memory here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className="h-48 mt-2 font-serif resize-none"
                required
              />
            </div>

            {/* Optional image attachments for text memories */}
            <div>
              <Label>Add Photos (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>

              {formData.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (_, i) => i !== index,
                            ),
                          }));
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {formData.type === "audio" && (
          <div className="space-y-4">
            <Label>Audio Recording</Label>
            <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Mic className="w-12 h-12 mx-auto mb-4 text-red-500" />

              {!isRecording && !audioUrl && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Click the Audio button above to start recording
                  </p>
                </div>
              )}

              {isRecording && (
                <div>
                  <p className="text-red-600 dark:text-red-400 mb-2">
                    Recording...
                  </p>
                  <p className="text-2xl font-mono mb-4">
                    {formatDuration(duration)}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      variant="outline"
                    >
                      {isPaused ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={stopRecording}
                      variant="destructive"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {audioUrl && (
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-4">
                    {isTranscribing ? "Transcribing..." : "Recording complete!"}
                  </p>
                  <audio controls src={audioUrl} className="mx-auto mb-4" />
                  <Button
                    type="button"
                    onClick={() => {
                      resetRecording();
                      setFormData((prev) => ({
                        ...prev,
                        audioUrl: null,
                        audioTranscript: "",
                        content: "",
                      }));
                    }}
                    variant="outline"
                  >
                    Record Again
                  </Button>
                </div>
              )}
            </div>

            {formData.audioTranscript && (
              <div>
                <Label htmlFor="transcript">Transcript (editable)</Label>
                <Textarea
                  id="transcript"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="mt-2 font-serif resize-none"
                  rows={4}
                />
              </div>
            )}

            {/* Optional image attachments for audio memories */}
            <div>
              <Label>Add Photos (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>

              {formData.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (_, i) => i !== index,
                            ),
                          }));
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Memory Title */}
        <div>
          <Label htmlFor="title">Memory Title</Label>
          <Input
            id="title"
            placeholder="Give your memory a title..."
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="mt-2"
            required
          />
        </div>

        {/* Tags */}
        <div>
          <Label className="flex items-center mb-2">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              className="flex-1"
            />
            <Button type="button" onClick={addTag} variant="outline">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <Label className="flex items-center mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            Location
          </Label>
          <Input
            placeholder="Where did this happen?"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
          />
          {userLocation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  location: `${userLocation.latitude}, ${userLocation.longitude}`,
                }))
              }
            >
              Use Current Location
            </Button>
          )}
        </div>

        {/* People */}
        <div>
          <Label className="flex items-center mb-2">
            <Users className="w-4 h-4 mr-2" />
            People
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a person..."
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addPerson())
              }
              className="flex-1"
            />
            <Button type="button" onClick={addPerson} variant="outline">
              Add
            </Button>
          </div>
          {formData.people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.people.map((person, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {person}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removePerson(person)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={createMemoryMutation.isPending}
        >
          {createMemoryMutation.isPending
            ? "Creating Memory..."
            : "Create Memory"}
        </Button>
      </form>
    </div>
  );
}
