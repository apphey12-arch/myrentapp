import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  BarChart3, 
  LogOut,
  Sun,
  Menu,
  X,
  Settings,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/units', label: t('myUnits'), icon: Home },
    { path: '/calendar', label: t('calendar'), icon: Calendar },
    { path: '/expenses', label: t('expenses'), icon: Receipt },
    { path: '/reports', label: t('reports'), icon: BarChart3 },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "fixed top-0 z-40 hidden h-screen w-64 lg:block",
        isRTL ? "right-0" : "left-0"
      )}>
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <Sun className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
                Sunlight Village
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Property Manager</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-5 w-5" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={cn(
        "fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ocean">
            <Sun className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Sunlight Village</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-16 lg:hidden">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-muted-foreground hover:bg-secondary"
            >
              <LogOut className="h-5 w-5" />
              {t('signOut')}
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="min-h-screen pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};
