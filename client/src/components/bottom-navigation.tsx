import { Link, useLocation } from "wouter";
import { Home, Search, Lightbulb, User, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Timeline" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/shared-with-me", icon: Share2, label: "Shared" },
    { href: "/prompts", icon: Lightbulb, label: "Prompts" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href} className="flex-1 py-3 px-4 text-center">
                <div className={cn(
                  "flex flex-col items-center transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                )}>
                  <Icon size={20} className="mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
