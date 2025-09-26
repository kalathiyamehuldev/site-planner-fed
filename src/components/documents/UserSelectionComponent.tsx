import React, { useState, useEffect } from 'react';
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  getProjectMembers, 
  selectProjectMembers, 
  selectProjectMembersLoading, 
  selectProjectMembersError 
} from '@/redux/slices/projectsSlice';

interface UserSelectionComponentProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  disabled?: boolean;
  projectId: string; // required
}

export const UserSelectionComponent: React.FC<UserSelectionComponentProps> = ({
  selectedUserIds = [],         // ✅ default empty array
  onChange,
  disabled = false,
  projectId
}) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();

  // ✅ always fall back to an empty array so cmdk never receives undefined
  const projectMembers =
    useAppSelector(selectProjectMembers(projectId)) ?? [];
  const memberLoading =
    useAppSelector(selectProjectMembersLoading) ?? false;
  const memberError =
    useAppSelector(selectProjectMembersError) ?? null;

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectMembers(projectId));
    }
  }, [dispatch, projectId]);

  const handleToggleUser = (userId: string) => {
    const newSelectedUserIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];

    onChange(newSelectedUserIds);
  };

  const handleRemoveUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={selectedUserIds.length > 0 ? selectedUserIds[selectedUserIds.length - 1] : ""}
        onValueChange={(value) => {
          if (value) {
            handleToggleUser(value);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Users" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-fit max-h-72">
            {memberLoading ? (
              <div className="p-2 text-center">Loading users...</div>
            ) : memberError ? (
              <div className="p-2 text-center text-red-500">
                {String(memberError)}
              </div>
            ) : projectMembers.length > 0 ? (
              projectMembers.map((member) => (
                <SelectItem 
                  key={member.user.id} 
                  value={member.user.id}
                >
                  <div className="flex items-center">
                    {selectedUserIds.includes(member.user.id) && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {member.user.firstName} {member.user.lastName}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center">No users available</div>
            )}
          </ScrollArea>
        </SelectContent>
      </Select>

      {selectedUserIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedUserIds.map((userId) => {
            const member = projectMembers.find((m) => m.user.id === userId);
            return (
              <Badge key={userId} variant="secondary" className="px-2 py-1">
                {member
                  ? `${member.user.firstName} ${member.user.lastName}`
                  : 'Unknown User'}
                <button
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleRemoveUser(userId, e)}
                  disabled={disabled}
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSelectionComponent;