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
import { AlertTriangle, Replace, FilePlus } from 'lucide-react';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  onReplace: () => void;
  onCreateVersion: () => void;
  onCancel: () => void;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onOpenChange,
  documentName,
  onReplace,
  onCreateVersion,
  onCancel,
}) => {
  const handleReplace = () => {
    onReplace();
    // Don't close dialog here - let the parent handle it
  };

  const handleCreateVersion = () => {
    onCreateVersion();
    // Don't close dialog here - let the parent handle it
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Document Name Conflict</DialogTitle>
          </div>
          <DialogDescription>
            A document with the name "{documentName}" already exists in this location.
            How would you like to proceed?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Replace Option */}
            <button 
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left w-full cursor-pointer hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              onClick={handleReplace}
            >
              <div className="flex items-start space-x-3">
                <Replace className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Replace existing document</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    The current document will be completely replaced with the new file.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </button>

            {/* Create Version Option */}
            <button 
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left w-full cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={handleCreateVersion}
            >
              <div className="flex items-start space-x-3">
                <FilePlus className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Create new version</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep the existing document and add this as a new version.
                    Previous versions will remain accessible.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionDialog;