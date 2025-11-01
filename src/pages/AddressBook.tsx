
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ContactModal from "@/components/contacts/ContactModal";
import DeleteContactDialog from "@/components/contacts/DeleteContactDialog";
import usePermission from "@/hooks/usePermission";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import {
  Plus,
  Search,
  Filter,
  User,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Heart,
  ChevronDown,
  Edit,
  Trash2,
  Star,
  FileText,
  Clock,
  Tag as TagIcon,
} from "lucide-react";
import {
  fetchAllContactsByCompany,
  fetchContactsByProject,
  selectAllContacts,
  selectProjectContacts,
  selectContactsLoading,
  selectContactsError,
  selectSelectedContact,
  setSelectedContact,
  clearSelectedContact,
  clearError,
  updateContactAsync,
  type Contact,
} from "@/redux/slices/contactsSlice";
import { selectAllProjects, fetchProjects } from "@/redux/slices/projectsSlice";
import { fetchTags, Tag } from "@/redux/slices/adminSlice";

const contactTypes = ["All", "Client", "Vendor", "Architect"];

const AddressBook = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const contacts = useSelector(selectAllContacts);
  const projectContacts = useSelector(selectProjectContacts);
  const selectedContact = useSelector(selectSelectedContact);
  const projects = useSelector(selectAllProjects);
  const error = useSelector(selectContactsError);
  const { hasPermission } = usePermission();
  const resource = 'contacts';

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const allTags = useSelector((state: any) => state.admin.tags.items);

  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">(
    "add"
  );
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    // Clear any existing errors before fetching
    dispatch(clearError());
    dispatch(fetchAllContactsByCompany({}) as any);
    dispatch(fetchProjects() as any);
    dispatch(fetchTags() as any);
  }, [dispatch]);

  useEffect(() => {
    if (selectedProject !== "All") {
      dispatch(fetchContactsByProject(selectedProject) as any);
    }
  }, [dispatch, selectedProject]);

  // Handle error toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      // Clear error after displaying
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  // Filter contacts based on search term, type, tags, and favorites
  const contactsToFilter = selectedProject === "All" ? contacts : projectContacts;
  const filteredContacts = contactsToFilter.filter((contact: Contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "All" || contact.type === selectedType;

    const matchesTags = selectedTags.length === 0 ||
      (contact.tags && contact.tags.some(tag => selectedTags.includes(tag.name)));

    const matchesFavorites = !showFavoritesOnly || contact.isFavorite;

    return matchesSearch && matchesType && matchesTags && matchesFavorites;
  });

  const toggleFavorite = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      dispatch(updateContactAsync({
        id: contactId,
        data: { isFavorite: !contact.isFavorite }
      }) as any);
    }
  };

  // Modal handlers
  const handleAddContact = () => {
    setContactModalMode("add");
    setContactToEdit(null);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setContactModalMode("edit");
    setContactToEdit(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };
  const handleContactDeleted = () => {
    // Clear selected contact if it was the one deleted
    if (
      selectedContact &&
      contactToDelete &&
      selectedContact.id === contactToDelete.id
    ) {
      dispatch(clearSelectedContact());
    }
  };

  const getContactInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getContactColor = (id: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
      "bg-indigo-100 text-indigo-600",
    ];

    // Use a hash function to generate a consistent color based on the ID
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Helper function to get project status styling
  const getProjectStatusStyle = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-600";
      case "Completed":
        return "bg-green-100 text-green-600";
      case "On Hold":
        return "bg-amber-100 text-amber-600";
      case "Not Started":
        return "bg-gray-100 text-gray-600";
      case "Active":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Helper function to get contact's projects with full details
  const getContactProjects = (contact: Contact) => {
    if (!contact.projects || contact.projects.length === 0) {
      return [];
    }

    // For now, we need to match project names since Contact.projects is string[]
    // In a real implementation, this would use project IDs
    return projects.filter(project =>
      contact.projects?.includes(project.title)
    );
  };

  return (
    <PageContainer>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light mb-1">Address Book</h1>
            <p className="text-sm text-muted-foreground">
              Manage clients, vendors, and other contacts
            </p>
          </div>
          <ActionButton
            variant="primary"
            motion="subtle"
            onClick={handleAddContact}
            className={!hasPermission(resource, 'create') ? 'hidden' : ''}
            text="Add Contact"
            leftIcon={<Plus size={16} />}
          />
        </div>

        {/* Filters and Search */}
        <div className="space-y-3 animate-fade-in animation-delay-[0.1s]">
          {/* Search Row */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Unified Filter Dropdown - Mobile Only */}
              <FilterDropdown
                filters={[
                  {
                    id: 'type',
                    label: 'Contact Type',
                    options: contactTypes.map(type => ({ value: type, label: type }))
                  },
                  {
                    id: 'project',
                    label: 'Projects',
                    options: [
                      { value: 'All', label: 'All Projects' },
                      ...projects.map(project => ({ value: project.id, label: project.title }))
                    ]
                  },
                  {
                    id: 'tags',
                    label: 'Tags',
                    options: allTags.map(tag => ({ value: tag.name, label: tag.name }))
                  }
                ]}
                selectedFilters={{
                  type: selectedType !== 'All' ? [selectedType] : [],
                  project: selectedProject !== 'All' ? [selectedProject] : [],
                  tags: selectedTags
                }}
                onFilterChange={(filterId, values) => {
                  if (filterId === 'type') {
                    setSelectedType(values.length > 0 ? values[0] : 'All');
                  } else if (filterId === 'project') {
                    setSelectedProject(values.length > 0 ? values[0] : 'All');
                  } else if (filterId === 'tags') {
                    setSelectedTags(values);
                  }
                }}
                className="flex-shrink-0 lg:hidden"
              />

              {/* Individual Filters - Desktop/Tablet Only */}
              <div className="hidden lg:flex items-center gap-3">
                {/* Contact Type Dropdown */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[120px] flex-shrink-0"
                >
                  {contactTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Project Dropdown */}
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] flex-shrink-0"
                >
                  <option value="All">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>

                {/* Tag Filter Toggle */}
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                    selectedTags.length > 0
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Filter size={16} />
                  <span>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                </button>
              </div>
            </div>

            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap flex-shrink-0",
                showFavoritesOnly
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Heart size={14} />
              <span className="hidden sm:inline">Favorites</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tag Filter */}
      {showTagFilter && (
        <div className="animate-fade-in animation-delay-[0.1s]">
          <GlassCard className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Filter by Tags</h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.name)
                        ? prev.filter(t => t !== tag.name)
                        : [...prev, tag.name]
                    );
                  }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    selectedTags.includes(tag.name)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Contact List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in animation-delay-[0.2s]">
        {/* Contact List */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="p-3 border-b border-border">
              <h2 className="text-base font-medium">
                Contacts ({filteredContacts.length})
              </h2>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center">
                  <Users
                    className="mx-auto mb-3 text-muted-foreground"
                    size={32}
                  />
                  <h3 className="text-lg font-medium mb-1">
                    No contacts found
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Try a different search or filter
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={cn(
                      "p-3 hover:bg-secondary/40 cursor-pointer transition-colors",
                      selectedContact?.id === contact.id && "bg-secondary/50"
                    )}
                    onClick={() => {
                      if (contact.id === selectedContact?.id) {
                        dispatch(clearSelectedContact());
                      } else {
                        dispatch(setSelectedContact(contact));
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {contact.image ? (
                        <img
                          src={contact.image}
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                            getContactColor(contact.id)
                          )}
                        >
                          {getContactInitials(contact.name)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate text-sm">
                            {contact.name}
                          </h3>
                          {contact.isFavorite && (
                            <Star
                              className="h-3 w-3 text-amber-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.company}
                        </p>
                        {(contact.tags && contact.tags.length > 0) || (contact.vendorTags && contact.vendorTags.length > 0) ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* Contact tags */}
                            {contact.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={typeof tag === 'object' ? tag.id : tag}
                                className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
                              >
                                {typeof tag === 'object' ? tag.name : tag}
                              </span>
                            ))}
                            {/* Vendor tags */}
                            {contact.vendorTags?.slice(0, 2).map((tag) => (
                              <span
                                key={`vendor-${typeof tag === 'object' ? tag.id : tag}`}
                                className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full"
                              >
                                {typeof tag === 'object' ? tag.name : tag}
                              </span>
                            ))}
                            {((contact.tags?.length || 0) + (contact.vendorTags?.length || 0)) > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{((contact.tags?.length || 0) + (contact.vendorTags?.length || 0)) - 2}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Contact Details */}
        <div className="lg:col-span-3">
          {selectedContact ? (
            <GlassCard className="h-full">
              <div key={selectedContact.id}>
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h2 className="text-base font-medium">Contact Details</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(selectedContact.id)}
                      className={cn(
                        "p-1 rounded-md text-foreground hover:bg-secondary transition-colors"
                      )}
                    >
                      <Heart
                        size={16}
                        className={
                          selectedContact.isFavorite
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground"
                        }
                      />
                    </button>
                    <ActionButton
                      variant="gray"
                      motion="subtle"
                      onClick={() => handleEditContact(selectedContact)}
                      className={!hasPermission(resource, 'update') ? 'hidden' : ''}
                      text="Edit"
                      leftIcon={<Edit size={14} />}
                    />
                    <ActionButton
                      variant="gray"
                      motion="subtle"
                      onClick={() => handleDeleteContact(selectedContact)}
                      className={!hasPermission(resource, 'delete') ? 'hidden' : ''}
                      text="Delete"
                      leftIcon={<Trash2 size={14} />}
                    />
                  </div>
                </div>

                <div className="p-4">
                  {/* Header Section with Profile */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex flex-col items-center sm:items-start">
                      {selectedContact.image ? (
                        <img
                          src={selectedContact.image}
                          alt={selectedContact.name}
                          className="w-20 h-20 rounded-lg object-cover mb-3 shadow-sm"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-20 h-20 rounded-lg flex items-center justify-center text-lg font-semibold mb-3 shadow-sm",
                            getContactColor(selectedContact.id)
                          )}
                        >
                          {getContactInitials(selectedContact.name)}
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide",
                          selectedContact.type === "Client" &&
                          "bg-blue-100 text-blue-700",
                          selectedContact.type === "Vendor" &&
                          "bg-green-100 text-green-700",
                          selectedContact.type === "Architect" &&
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        {selectedContact.type}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold mb-1 text-foreground">
                        {selectedContact.name}
                      </h1>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedContact.company || "Independent"}
                      </p>

                      {/* Quick Contact Actions */}
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`mailto:${selectedContact.email}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs font-medium"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                        {selectedContact.phone && (
                          <a
                            href={`tel:${selectedContact.phone}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-xs font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        Contact Information
                      </h3>

                      <div className="bg-card border rounded-lg p-3 space-y-3">
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Email Address
                            </p>
                            <a
                              href={`mailto:${selectedContact.email}`}
                              className="text-primary hover:underline font-medium break-all text-sm"
                            >
                              {selectedContact.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Phone Number
                            </p>
                            <a
                              href={`tel:${selectedContact.phone}`}
                              className="hover:text-primary font-medium text-sm"
                            >
                              {selectedContact.phone || "Not provided"}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Address
                            </p>
                            <p className="font-medium text-sm">{selectedContact.address || "Not provided"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tags Section */}
                      {(selectedContact.tags && selectedContact.tags.length > 0) || (selectedContact.vendorTags && selectedContact.vendorTags.length > 0) ? (
                        <div className="mt-3">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Tags
                          </h3>
                          <div className="space-y-2">
                            {/* Contact tags */}
                            {selectedContact.tags && selectedContact.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-muted-foreground">Contact:</span>
                                {selectedContact.tags.map((tag) => (
                                  <span
                                    key={typeof tag === 'object' ? tag.id : tag}
                                    className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {typeof tag === 'object' ? tag.name : tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Vendor tags */}
                            {selectedContact.vendorTags && selectedContact.vendorTags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-muted-foreground">Vendor:</span>
                                {selectedContact.vendorTags.map((tag) => (
                                  <span
                                    key={`vendor-${typeof tag === 'object' ? tag.id : tag}`}
                                    className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full"
                                  >
                                    {typeof tag === 'object' ? tag.name : tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {selectedContact.type === 'Vendor' && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-primary" />
                          Related Projects
                        </h3>

                        <div className="bg-card border rounded-lg p-3">
                          {(() => {
                            const contactProjects = getContactProjects(selectedContact);
                            return contactProjects.length > 0 ? (
                              <div className="space-y-2">
                                {contactProjects.map((project) => (
                                  <div key={project.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                                    <a
                                      href="#"
                                      className="hover:text-primary font-medium flex-1 truncate text-sm"
                                      title={project.title}
                                    >
                                      {project.title}
                                    </a>
                                    <span className={cn(
                                      "text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0",
                                      getProjectStatusStyle(project.status)
                                    )}>
                                      {project.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-center py-3 text-sm">No projects associated</p>
                            );
                          })()}
                        </div>
                      </div>)}
                  </div>

                  {/* Notes Section */}
                  {/* <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-primary" />
                        Notes
                      </h3>
                      
                      <div className="bg-card border rounded-lg p-4">
                        <textarea
                          placeholder="Add notes about this contact..."
                          className="w-full h-32 bg-background rounded-lg p-4 border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm"
                        ></textarea>
                        <div className="flex justify-end mt-4">
                          <ActionButton
                            variant="primary"
                            motion="subtle"
                            text="Save Notes"
                          />
                        </div>
                      </div>
                    </div> */}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="h-full flex items-center justify-center p-6 text-center">
              <div>
                <User
                  className="mx-auto mb-3 text-muted-foreground"
                  size={32}
                />
                <h3 className="text-lg font-medium mb-2">
                  No Contact Selected
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                  Select a contact from the list to view their details, or add
                  a new contact to your address book.
                </p>
                {hasPermission(resource, 'create') && (
                  <ActionButton
                    variant="primary"
                    motion="subtle"
                    onClick={handleAddContact}
                    text="Add New Contact"
                    leftIcon={<Plus size={16} />}
                  />
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Modals */}
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        contact={contactToEdit}
        mode={contactModalMode}
      />

      <DeleteContactDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        contact={contactToDelete}
        onDeleted={handleContactDeleted}
      />
    </PageContainer >
  );
};

export default AddressBook;
