import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Globe } from 'lucide-react';
import { PdfLanguage } from '@/lib/pdf';
import { cn } from '@/lib/utils';

interface PdfLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (language: PdfLanguage) => Promise<void>;
  title?: string;
}

export const PdfLanguageModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Export PDF',
}: PdfLanguageModalProps) => {
  const [language, setLanguage] = useState<PdfLanguage>('en');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(language);
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const languageOptions = [
    {
      value: 'en' as PdfLanguage,
      label: 'English',
      subtitle: 'Left-to-Right',
      flag: '🇬🇧',
    },
    {
      value: 'ar' as PdfLanguage,
      label: 'العربية',
      subtitle: 'Right-to-Left',
      flag: '🇪🇬',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Choose the language for your PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-2 gap-3">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer group",
                  "hover:shadow-md hover:scale-[1.02] hover:border-primary/50",
                  language === option.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                {/* Selection indicator */}
                <div
                  className={cn(
                    "absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition-all",
                    language === option.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {language === option.value && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Flag */}
                <span className="text-3xl">{option.flag}</span>

                {/* Globe icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    language === option.value
                      ? "bg-primary/10"
                      : "bg-muted group-hover:bg-primary/5"
                  )}
                >
                  <Globe
                    className={cn(
                      "h-5 w-5 transition-colors",
                      language === option.value
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                </div>

                {/* Text */}
                <div className="text-center">
                  <p className="font-semibold text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="gradient-ocean gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
