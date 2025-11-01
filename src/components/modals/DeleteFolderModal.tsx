import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ActionButton from '@/components/ui/ActionButton';
import { AlertTriangle, Folder, FileText } from 'lucide-react';
import { Folder as FolderType } from '@/redux/slices/foldersSlice';
import usePermission from '@/hooks/usePermission';

interface DeleteFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderType | null;
  onConfirm: (cascade: boolean) => void;
  loading?: boolean;
}

const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  open,
  onOpenChange,
  folder,
  onConfirm,
  loading = false
}) => {
  const { hasPermission } = usePermission();
  const resource = 'documents';
  
  if (!folder) return null;
  if (!hasPermission(resource, 'delete')) return null;

  const hasChildren = folder.children && folder.children.length > 0;
  const hasDocuments = folder.documentCount > 0;
  const hasContent = hasChildren || hasDocuments;

  const handleSimpleDelete = () => {
    onConfirm(false);
  };

  const handleCascadeDelete = () => {
    onConfirm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-5/6 md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Folder
          </DialogTitle>
          <DialogDescription>
            You are about to delete the folder <strong>"{folder.name}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {hasContent ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">
                      This folder contains:
                    </h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      {hasChildren && (
                        <li className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder.children.length} subfolder{folder.children.length !== 1 ? 's' : ''}
                        </li>
                      )}
                      {hasDocuments && (
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {folder.documentCount} document{folder.documentCount !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Choose how you want to proceed:</p>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>Cancel:</strong> Keep the folder and its contents</li>
                  <li>• <strong>Delete All:</strong> Delete the folder and all its contents permanently</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>This folder is empty and can be safely deleted.</p>
              <p className="mt-2 font-medium text-destructive">
                This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <ActionButton
            variant="secondary"
            motion="subtle"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            text="Cancel"
          />
          {hasContent ? (
            <ActionButton
              variant="primary"
              motion="subtle"
              onClick={handleCascadeDelete}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              text={loading ? 'Deleting...' : 'Delete All Contents'}
            />
          ) : (
            <ActionButton
              variant="primary"
              motion="subtle"
              onClick={handleSimpleDelete}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              text={loading ? 'Deleting...' : 'Delete Folder'}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteFolderModal;