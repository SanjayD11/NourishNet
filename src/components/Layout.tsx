import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Leaf, LogOut, User, MapPin, Inbox, Plus, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useFoodPostRequests } from '@/hooks/useFoodPostRequests';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { requests } = useFoodPostRequests();
  const hasPendingRequests = requests.some((request) => request.status === 'pending');
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: MapPin },
    { name: 'Requests', href: '/requests', icon: Inbox },
    { name: 'Add Food', href: '/post-food', icon: Plus },
    { name: 'Manage Posts', href: '/manage-posts', icon: Settings }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col">
      {/* Navigation Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card mx-4 mt-4 mb-6"
      >
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground tracking-tight" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>NourishNet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const showRequestsBadge = item.name === 'Requests' && hasPendingRequests;
                return (
                  <Link 
                    key={item.name} 
                    to={item.href} 
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {showRequestsBadge && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary ring-2 ring-card" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-200 hover:scale-105"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-xl shadow-lg border-2 bg-card mt-2 p-1.5">
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2.5 cursor-pointer rounded-lg py-2.5 px-3 font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>Show Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive rounded-lg py-2.5 px-3 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation */}
      <motion.nav 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="md:hidden fixed bottom-4 left-4 right-4 z-50"
      >
        <div className="glass-card px-2 py-2 shadow-xl">
          <div className="flex items-center justify-around">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const showRequestsBadge = item.name === 'Requests' && hasPendingRequests;
              return (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 min-w-[60px] ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground active:bg-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                  {showRequestsBadge && (
                    <span className="absolute top-1.5 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary ring-2 ring-card" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="px-4 pb-28 md:pb-8 flex-1">
        {children}
      </main>

      {/* Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Back to Top */}
      <BackToTop />
    </div>
  );
}