import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { FileText, Loader2 } from 'lucide-react';

interface PdfLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (language: Language) => void;
  title?: string;
}

export const PdfLanguageModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Export PDF',
}: PdfLanguageModalProps) => {
  const { t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(selectedLang);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Select the language for your PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Choose the language for the exported PDF:
          </p>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant={selectedLang === 'en' ? 'default' : 'outline'}
              onClick={() => setSelectedLang('en')}
              className={selectedLang === 'en' ? 'gradient-ocean' : ''}
            >
              🇺🇸 English
            </Button>
            <Button
              type="button"
              variant={selectedLang === 'ar' ? 'default' : 'outline'}
              onClick={() => setSelectedLang('ar')}
              className={selectedLang === 'ar' ? 'gradient-ocean' : ''}
            >
              🇪🇬 العربية
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="gradient-ocean"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Generate PDF'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
