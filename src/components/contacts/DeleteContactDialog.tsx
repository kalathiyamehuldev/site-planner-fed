import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Contact, deleteContactAsync, selectContactsLoading, selectContactsError } from '@/redux/slices/contactsSlice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onDeleted?: () => void;
}

const DeleteContactDialog: React.FC<DeleteContactDialogProps> = ({ 
  open, 
  onOpenChange, 
  contact, 
  onDeleted 
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectContactsLoading);
  const error = useAppSelector(selectContactsError);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!contact) return;
    
    setIsDeleting(true);
    try {
      const result = await dispatch(deleteContactAsync(contact.id));
      if (deleteContactAsync.fulfilled.match(result)) {
        toast({
          title: 'Success',
          description: 'Contact deleted successfully',
        });
        onDeleted?.();
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in Redux and will show via error state
    } finally {
      setIsDeleting(false);
    }
  };

  // Show error toast when error changes and dialog is open
  useEffect(() => {
    if (error && open) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Contact</DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-4">
            Are you sure you want to delete <strong>{contact?.name}</strong>? 
            This action cannot be undone.
            {contact?.company && (
              <div className="text-muted-foreground mt-2">
                Company: {contact.company}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || loading || !contact}
          >
            {isDeleting || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contact
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteContactDialog;