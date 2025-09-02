import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchTags, createTag, Tag } from '@/redux/slices/adminSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  onTagCreated?: (tag: Tag) => void;
  redirectAfterCreate?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Search or add tags...",
  onTagCreated,
  redirectAfterCreate = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: tags, loading } = useSelector((state: RootState) => state.admin.tags);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = (tags || []).filter((tag) =>
    tag?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      // Ensure no duplicates when toggling
      const newTags = [...new Set([...selectedTags, tagName])];
      onTagsChange(newTags);
    }
    // Close dropdown when a tag is selected/deselected
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      try {
        const result = await dispatch(createTag({ name: newTagName.trim() })).unwrap();
        
        if (result && result.name) {
          // Ensure no duplicates when adding new tag
          const newTags = [...new Set([...selectedTags, result.name])];
          onTagsChange(newTags);
          
          if (onTagCreated) {
            onTagCreated(result);
          }
          
          // Refresh tags list to ensure new tag appears
          dispatch(fetchTags());
          
          setNewTagName('');
          setShowCreateDialog(false);
          setSearchQuery('');
        } else {
          console.error('Invalid tag creation response:', result);
        }
      } catch (error) {
        console.error('Failed to create tag:', error);
      }
    }
  };

  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagName));
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full"
        />

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                      selectedTags.includes(tag.name) ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.name) && (
                      <span className="ml-2 text-xs text-muted-foreground">(selected)</span>
                    )}
                  </button>
                ))}
                
                {searchQuery && !filteredTags.some(t => 
                  t.name.toLowerCase() === searchQuery.toLowerCase()
                ) && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent border-t"
                    onClick={() => {
                      setNewTagName(searchQuery);
                      setShowCreateDialog(true);
                    }}
                  >
                    <Plus size={14} className="inline mr-2" />
                    Add "{searchQuery}" as new tag
                  </button>
                )}
                
                {filteredTags.length === 0 && !searchQuery && (
                  <div className="p-2 text-sm text-muted-foreground">
                    No tags found
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag with the name: "{newTagName}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag}>
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagSelector;