import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Languages } from 'lucide-react';
import { PdfLanguage } from '@/lib/pdf';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Choose the language for your PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup
            value={language}
            onValueChange={(v) => setLanguage(v as PdfLanguage)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="en"
                id="lang-en"
                className="peer sr-only"
              />
              <Label
                htmlFor="lang-en"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Languages className="mb-3 h-6 w-6" />
                <span className="text-lg font-medium">English</span>
                <span className="text-sm text-muted-foreground">Left-to-Right</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="ar"
                id="lang-ar"
                className="peer sr-only"
              />
              <Label
                htmlFor="lang-ar"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Languages className="mb-3 h-6 w-6" />
                <span className="text-lg font-medium">العربية</span>
                <span className="text-sm text-muted-foreground">Right-to-Left</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3">
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
            className="gradient-ocean"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
