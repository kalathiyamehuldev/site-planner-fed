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
import { AlertTriangle, User } from 'lucide-react';
import { Member } from '@/redux/slices/adminSlice';
import usePermission from '@/hooks/usePermission';

interface DeleteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  open,
  onOpenChange,
  member,
  onConfirm,
  loading = false
}) => {
  const { hasPermission } = usePermission();
  const resource = 'users';
  
  if (!member) return null;
  if (!hasPermission(resource, 'delete')) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Member
          </DialogTitle>
          <DialogDescription>
            You are about to delete the member <strong>"{member.firstName} {member.lastName}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">
                  This member will be permanently deleted:
                </h4>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <User className="h-4 w-4" />
                  <span>{member.firstName} {member.lastName}</span>
                </div>
                <div className="mt-1 text-sm text-red-700">
                  Email: {member.email}
                </div>
                <div className="mt-1 text-sm text-red-700">
                  Role: {member.role.name}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium text-destructive">
              This action cannot be undone. The member will be permanently removed from your company.
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
            {loading ? 'Deleting...' : 'Delete Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMemberModal;