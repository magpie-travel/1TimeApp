import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Share2, Users, Mail, X, Globe, Lock, UserPlus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { MemoryShare } from '@shared/schema';

interface MemorySharingProps {
  memoryId: string;
  currentVisibility: string;
  onVisibilityChange?: (visibility: string) => void;
}

export function MemorySharing({ memoryId, currentVisibility, onVisibilityChange }: MemorySharingProps) {
  const [shareEmail, setShareEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [visibility, setVisibility] = useState(currentVisibility);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current shares
  const { data: shares = [], isLoading: sharesLoading } = useQuery<MemoryShare[]>({
    queryKey: ['/api/memories', memoryId, 'shares'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/memories/${memoryId}/shares`);
      return response.json();
    },
  });

  // Share with specific user
  const shareWithUserMutation = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: string }) => {
      const response = await apiRequest('POST', `/api/memories/${memoryId}/share-with-user`, {
        email,
        permission,
        sharedByUserId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId, 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-memories'] });
      toast({ title: 'Memory shared successfully!' });
      setShareEmail('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to share memory',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: async (newVisibility: string) => {
      const response = await apiRequest('PATCH', `/api/memories/${memoryId}/visibility`, {
        visibility: newVisibility,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId] });
      toast({ title: 'Privacy settings updated!' });
      onVisibilityChange?.(visibility);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update privacy settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke share
  const revokeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await apiRequest('DELETE', `/api/shares/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId, 'shares'] });
      toast({ title: 'Share access revoked' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke access',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleShareWithUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    shareWithUserMutation.mutate({ email: shareEmail.trim(), permission });
  };

  const handleVisibilityChange = (newVisibility: string) => {
    setVisibility(newVisibility);
    updateVisibilityMutation.mutate(newVisibility);
  };

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'shared': return <Users className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityDescription = (vis: string) => {
    switch (vis) {
      case 'public': return 'Anyone with the link can view this memory';
      case 'shared': return 'Only people you share with can view this memory';
      default: return 'Only you can view this memory';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Share2 className="w-5 h-5 mr-2" />
          Share Memory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Settings */}
        <div>
          <Label className="text-sm font-medium flex items-center mb-3">
            <Lock className="w-4 h-4 mr-2" />
            Privacy Settings
          </Label>
          <Select value={visibility} onValueChange={handleVisibilityChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Shared</span>
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            {getVisibilityIcon(visibility)}
            <span className="ml-2">{getVisibilityDescription(visibility)}</span>
          </div>
        </div>

        <Separator />

        {/* Share with specific users */}
        {visibility !== 'private' && (
          <div>
            <Label className="text-sm font-medium flex items-center mb-3">
              <UserPlus className="w-4 h-4 mr-2" />
              Share with Specific People
            </Label>
            
            <form onSubmit={handleShareWithUser} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                disabled={shareWithUserMutation.isPending || !shareEmail.trim()}
                className="w-full"
              >
                {shareWithUserMutation.isPending ? 'Sharing...' : 'Share'}
              </Button>
            </form>
          </div>
        )}

        {/* Current shares */}
        {shares.length > 0 && (
          <div>
            <Label className="text-sm font-medium flex items-center mb-3">
              <Mail className="w-4 h-4 mr-2" />
              People with Access ({shares.length})
            </Label>
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {share.sharedWithEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{share.sharedWithEmail}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {share.permission === 'view' ? 'Can view' : 'Can edit'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeShareMutation.mutate(share.id)}
                    disabled={revokeShareMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>How sharing works:</strong> When you share a memory with someone's email, 
            they'll be able to access it when they sign in to 1time.ai with that email address.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}