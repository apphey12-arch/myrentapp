import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Globe, Moon, Sun, Palette } from 'lucide-react';

const SettingsPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground mt-1">Customize your experience</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Language Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('language')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'gradient-ocean' : ''}
                >
                  🇺🇸 {t('english')}
                </Button>
                <Button
                  variant={language === 'ar' ? 'default' : 'outline'}
                  onClick={() => setLanguage('ar')}
                  className={language === 'ar' ? 'gradient-ocean' : ''}
                >
                  🇪🇬 {t('arabic')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'التطبيق يدعم اللغة العربية مع اتجاه من اليمين لليسار'
                  : 'The app supports Arabic with right-to-left layout'}
              </p>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('theme')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
                      {theme === 'dark' ? t('darkMode') : t('lightMode')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' 
                        ? 'Using dark theme for reduced eye strain'
                        : 'Using light theme for better visibility'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="theme-toggle"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Sunlight Village</strong> - Property Management System</p>
              <p>Version 1.0.0</p>
              <p>© 2024 All rights reserved</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
