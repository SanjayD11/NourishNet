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
      {/* Navigation Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card mx-3 mt-3 sm:mx-4 sm:mt-4 mb-4 sm:mb-6"
      >
        <div className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground tracking-tight whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>NourishNet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const showRequestsBadge = item.id === 'Requests' && hasPendingRequests;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
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

            <div className="flex items-center gap-0 sm:gap-3 ml-auto">
              <div className="scale-[0.85] sm:scale-100 flex items-center justify-center"><LanguageSelector /></div>
              <div className="scale-[0.85] sm:scale-100 flex items-center justify-center -ml-1 sm:ml-0"><ThemeToggle /></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform duration-200 hover:scale-105 ml-0.5 sm:ml-1"
                  >
                    <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
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
                    <span>{t('nav.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setLogoutDialogOpen(true);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive rounded-lg py-2.5 px-3 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Confirmation Dialog */}
              <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out of NourishNet?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('nav.logout')}? You'll need to sign in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={signOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('nav.logout')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </motion.header>

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