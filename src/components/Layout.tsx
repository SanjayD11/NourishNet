import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Leaf, LogOut, User, MapPin, Inbox, Plus, Settings, HeartPulse } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFoodPostRequests } from '@/hooks/useFoodPostRequests';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { requests } = useFoodPostRequests();
  const { t } = useLanguage();
  const hasPendingRequests = requests.some((request) => request.status === 'pending');

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: MapPin, id: 'Dashboard' },
    { name: t('nav.requests'), href: '/requests', icon: Inbox, id: 'Requests' },
    { name: t('nav.addFood'), href: '/post-food', icon: Plus, id: 'AddFood' },
    { name: t('healthAdvisor.title'), href: '/food-scanner', icon: HeartPulse, id: 'HealthAdvisor' },
    { name: t('nav.managePosts'), href: '/manage-posts', icon: Settings, id: 'ManagePosts' }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col">
      {/* Navigation Header - Premium Floating Dock */}
      <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-6 sm:pt-6 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card mx-auto max-w-7xl pointer-events-auto relative overflow-hidden"
          style={{ 
            backdropFilter: 'blur(20px)',
            border: '1px solid hsla(var(--glass-border) / 0.5)',
            boxShadow: '0 8px 32px -4px hsla(var(--glass-shadow) / 0.1)'
          }}
        >
          <div className="px-4 py-2.5 sm:px-6 sm:py-3.5">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 relative z-10">
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <span className="font-extrabold text-foreground tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}>
                  NourishNet
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1.5 relative px-1 py-1 bg-muted/30 rounded-2xl border border-muted/20">
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const showRequestsBadge = item.id === 'Requests' && hasPendingRequests;
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 group z-10 ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/20"
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                      
                      <Icon className={`w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-primary/70'}`} />
                      <span className="relative z-10">{item.name}</span>
                      
                      {showRequestsBadge && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-20">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-background shadow-sm" />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3.5 relative z-10 ml-auto md:ml-0">
                <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-muted/10">
                  <LanguageSelector />
                  <div className="w-px h-4 bg-muted/40 mx-0.5 hidden sm:block" />
                  <ThemeToggle />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group relative flex items-center gap-2 p-0.5 rounded-full hover:bg-muted/30 transition-all duration-300 focus:outline-none"
                    >
                      <div className="relative">
                        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-transparent group-hover:border-primary/30 transition-all duration-300">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow-sm" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl shadow-2xl border-muted/20 bg-card/95 backdrop-blur-xl mt-3 p-2 stagger-in">
                    <DropdownMenuItem
                      onClick={() => navigate('/profile')}
                      className="flex items-center gap-3 cursor-pointer rounded-xl py-3 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span>{t('nav.profile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setLogoutDialogOpen(true);
                      }}
                      className="flex items-center gap-3 cursor-pointer text-rose-500 focus:text-rose-600 rounded-xl py-3 px-4 font-semibold hover:bg-rose-500/10 transition-colors duration-200 mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>{t('nav.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.header>
      </div>

      <div className="h-20 sm:h-28" /> {/* Offset for fixed header */}

      {/* Mobile Navigation */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="md:hidden fixed bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-50 pointer-events-none"
      >
        <div className="glass-card px-1 py-1 sm:px-1.5 sm:py-1.5 shadow-xl mx-auto w-full max-w-[100vw] sm:max-w-md pointer-events-auto">
          <div className="flex items-center justify-between gap-0 sm:gap-1 w-full">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const showRequestsBadge = item.id === 'Requests' && hasPendingRequests;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1 sm:p-2.5 rounded-[10px] sm:rounded-xl transition-all duration-200 flex-1 min-w-0 h-14 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground active:bg-accent'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[9px] sm:text-xs font-semibold text-center tracking-tighter sm:tracking-normal whitespace-nowrap truncate w-full px-0.5">{item.name}</span>
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