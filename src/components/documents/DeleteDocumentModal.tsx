import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText } from 'lucide-react';
import { Document } from '@/redux/slices/documentsSlice';
import usePermission from '@/hooks/usePermission';

interface DeleteDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  open,
  onOpenChange,
  document,
  onConfirm,
  loading = false
}) => {
  const { hasPermission } = usePermission();
  const resource = 'documents';
  
  if (!document) return null;
  if (!hasPermission(resource, 'delete')) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Document
          </DialogTitle>
          <DialogDescription>
            You are about to delete the document <strong>"{document.name}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">
                  This document will be permanently deleted:
                </h4>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <FileText className="h-4 w-4" />
                  <span>{document.name}</span>
                  {document.type && (
                    <span className="text-red-600">({document.type})</span>
                  )}
                </div>
                {document.project && (
                  <div className="mt-1 text-sm text-red-700">
                    Project: {document.project}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium text-destructive">
              This action cannot be undone. The document file will be permanently removed from storage.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Deleting...' : 'Delete Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDocumentModal;