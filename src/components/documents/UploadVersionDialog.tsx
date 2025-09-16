import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { uploadDocumentVersion } from '@/redux/slices/documentsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { Document } from '@/redux/slices/documentsSlice';

interface UploadVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onVersionUploaded?: () => void;
}

interface FormData {
  file: File | null;
  versionNotes: string;
}

interface FormErrors {
  file?: string;
  versionNotes?: string;
}

export const UploadVersionDialog: React.FC<UploadVersionDialogProps> = ({
  open,
  onOpenChange,
  document,
  onVersionUploaded,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    file: null,
    versionNotes: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        file: null,
        versionNotes: '',
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.file) {
      newErrors.file = 'Please select a file to upload';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    if (file && errors.file) {
      setErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const handleVersionNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const versionNotes = e.target.value;
    setFormData(prev => ({ ...prev, versionNotes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(uploadDocumentVersion({
        id: document.id,
        file: formData.file!,
        versionNotes: formData.versionNotes || undefined,
      }));

      if (uploadDocumentVersion.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Failed to create document version';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Success - show success message from backend if available
      const successMessage = 'Document version created successfully';
      toast({
        title: 'Success',
        description: successMessage,
      });

      // Close dialog and call callback
      onOpenChange(false);
      onVersionUploaded?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create document version',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Create a version of {document?.name || 'Document'}
          </DialogTitle>
          <DialogDescription>
            Upload a version of this document
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className={errors.file ? 'border-red-500' : ''}
                disabled={loading}
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {errors.file && (
              <p className="text-sm text-red-500">{errors.file}</p>
            )}
            {formData.file && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="versionNotes">Version Notes</Label>
            <Textarea
              id="versionNotes"
              placeholder="Optional notes about this version..."
              value={formData.versionNotes}
              onChange={handleVersionNotesChange}
              className={errors.versionNotes ? 'border-red-500' : ''}
              disabled={loading}
              rows={3}
            />
            {errors.versionNotes && (
              <p className="text-sm text-red-500">{errors.versionNotes}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.file}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadVersionDialog;