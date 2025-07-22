import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useToast } from '../hooks/use-toast';
import { Upload, X, Image, Video, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileUploaded: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

interface UploadedFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export function FileUpload({ 
  onFileUploaded, 
  multiple = false, 
  accept = "image/*,video/*", 
  maxFiles = 5,
  showPreview = true,
  className = ""
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      
      if (files.length === 1) {
        const file = files[0];
        const endpoint = file.type.startsWith('image/') ? '/api/upload/image' : 
                        file.type.startsWith('video/') ? '/api/upload/video' : 
                        null;
        
        if (!endpoint) {
          throw new Error('Unsupported file type');
        }
        
        formData.append(file.type.startsWith('image/') ? 'image' : 'video', file);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
        
        const result = await response.json();
        return { files: [{ 
          url: result.imageUrl || result.videoUrl, 
          type: file.type, 
          name: file.name, 
          size: file.size 
        }] };
      } else {
        // Multiple files
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
        
        const response = await fetch('/api/upload/files', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
        
        return await response.json();
      }
    },
    onSuccess: (data) => {
      console.log('Upload success, data:', data);
      const newFiles = [...uploadedFiles, ...data.files];
      console.log('New files array:', newFiles);
      setUploadedFiles(newFiles);
      
      // Call the callback with the new files
      try {
        console.log('About to call onFileUploaded with:', newFiles);
        onFileUploaded(newFiles);
        console.log('onFileUploaded callback called successfully');
      } catch (error) {
        console.error('Error in onFileUploaded callback:', error);
      }
      
      // Re-enable toast
      toast({
        title: 'Files uploaded successfully!',
        description: `${data.files.length} file(s) uploaded`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    if (files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }
    
    uploadMutation.mutate(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFileUploaded(newFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Media Preview - Show above upload area */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ) : file.type.startsWith('video/') ? (
                <video
                  src={file.url}
                  className="w-full h-24 object-cover rounded-lg"
                  controls
                  preload="metadata"
                />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {uploadMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports images and videos up to 50MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploadMutation.isPending}
              >
                Choose Files
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}