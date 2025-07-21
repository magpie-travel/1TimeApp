import { Link } from "wouter";
import { Plus, Mic, Edit, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-6 z-50 md:bottom-6">
      {/* Sub-buttons (Audio, Text, and Media) */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
          <Link href="/create/audio">
            <Button 
              size="sm" 
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-red-500 hover:bg-red-600"
              onClick={() => setIsExpanded(false)}
            >
              <Mic size={20} />
            </Button>
          </Link>
          <Link href="/create/media">
            <Button 
              size="sm" 
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-green-500 hover:bg-green-600"
              onClick={() => setIsExpanded(false)}
            >
              <Camera size={20} />
            </Button>
          </Link>
          <Link href="/create">
            <Button 
              size="sm" 
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-blue-500 hover:bg-blue-600"
              onClick={() => setIsExpanded(false)}
            >
              <Edit size={20} />
            </Button>
          </Link>
        </div>
      )}
      
      {/* Main button */}
      <Button 
        size="lg" 
        className="px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus size={20} className={`transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`} />
        <span className="text-sm font-medium">Add Memory</span>
      </Button>
    </div>
  );
}
