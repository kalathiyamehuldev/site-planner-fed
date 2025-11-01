import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { uploadDocumentVersion } from '@/redux/slices/documentsSlice';
import ActionButton from '@/components/ui/ActionButton';
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

    const result = await dispatch(uploadDocumentVersion({
      id: document.id,
      file: formData.file!,
      versionNotes: formData.versionNotes || undefined,
    }));

    if (uploadDocumentVersion.rejected.match(result)) {
      const errorMessage = result.payload as string;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } else if (uploadDocumentVersion.fulfilled.match(result)) {
      toast({
        title: 'Success',
        description: 'Document version uploaded successfully',
      });
      // Close dialog and call callback
      onOpenChange(false);
      onVersionUploaded?.();
    }

    setLoading(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-5/6 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Create a version of {document?.name || 'Document'}
          </DialogTitle>
          <DialogDescription>
            Upload a new version of this document
          </DialogDescription>
        </DialogHeader>

        {/* Current Version Info */}
        {document && document.files && document.files.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Current Version</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Version:</span>
                <span className="ml-2 font-medium">v{document.files[0].version || 1}</span>
              </div>
              <div>
                <span className="text-gray-500">File Type:</span>
                <span className="ml-2 font-medium uppercase">{document.files[0].fileType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 font-medium">
                  {document.files[0].fileSize
                    ? `${Math.round(document.files[0].fileSize / 1024)} KB`
                    : 'N/A'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <span className="ml-2 font-medium">
                  {document.files[0].createdAt
                    ? new Date(document.files[0].createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : 'N/A'
                  }
                </span>
              </div>

            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">New Version</h4>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">New File *</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className={errors.file ? 'border-red-500' : ''}
                disabled={loading}
              />
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
            <Label htmlFor="versionNotes">
              Version Notes
              {document && document.files && document.files.length > 0 && (
                <span className="text-sm text-gray-500 font-normal">
                  (for v{(document.files[0].version || 1) + 1})
                </span>
              )}
            </Label>
            <Textarea
              id="versionNotes"
              placeholder="Describe what changed in this version..."
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
          <ActionButton
            variant="secondary"
            motion="subtle"
            onClick={handleCancel}
            disabled={loading}
            text="Cancel"
          />
          <ActionButton
            variant="primary"
            motion="subtle"
            onClick={handleSubmit}
            disabled={loading || !formData.file}
            text={loading ? 'Uploading...' : 'Upload'}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadVersionDialog;