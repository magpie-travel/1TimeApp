import { useState } from 'react';
import { useLocation } from 'wouter';
import { FileUpload } from '../components/file-upload';
import { BottomNavigation } from '../components/bottom-navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../lib/auth';
import { ArrowLeft, Sparkles, Image, Video, Plus } from 'lucide-react';
import { Link } from 'wouter';

interface UploadedFile {
  url: string;
  type: string;
  name: string;
  size: number;
}

export default function MediaInspiration() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [inspiration, setInspiration] = useState('');

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const handleCreateMemory = () => {
    // Navigate to create memory page with media data
    const mediaData = {
      files: uploadedFiles,
      inspiration: inspiration.trim(),
    };
    
    // Store in session storage for the create memory page
    sessionStorage.setItem('mediaInspiration', JSON.stringify(mediaData));
    setLocation('/create');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be signed in to create memories</p>
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
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">Media Inspiration</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Image className="w-5 h-5 mr-2 text-blue-500" />
              Upload Media for Inspiration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload images or videos that inspire a memory. These can help you remember special moments, 
              places, or experiences you want to capture in your memory journal.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <Image className="w-3 h-3 mr-1" />
                Images
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Video className="w-3 h-3 mr-1" />
                Videos
              </Badge>
              <Badge variant="outline" className="text-xs">
                Up to 50MB
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Upload Files</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileUploaded={handleFilesUploaded}
              multiple={true}
              accept="image/*,video/*"
              maxFiles={5}
              showPreview={true}
            />
          </CardContent>
        </Card>

        {/* Inspiration Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Inspiration Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Add some notes about what these files remind you of (optional)
            </p>
            <Textarea
              placeholder="What memories do these images or videos bring back? What story do they tell?"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCreateMemory}
            disabled={uploadedFiles.length === 0}
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Memory from Media
          </Button>
          
          <div className="text-center">
            <Link href="/create">
              <Button variant="outline" className="w-full">
                Create Memory Without Media
              </Button>
            </Link>
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2 text-sm">Tips for better memories:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Upload photos from special events or trips</li>
              <li>• Include videos with sound for richer memories</li>
              <li>• Add context notes to help future you remember</li>
              <li>• Consider uploading screenshots of conversations</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}