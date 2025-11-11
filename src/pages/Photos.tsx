import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Plus,
  Calendar,
  User,
  Image,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import usePermission from "@/hooks/usePermission";
import {
  fetchVisits,
  createVisit,
  selectAllVisits,
  selectVisitsLoading,
  selectVisitsError,
  selectVisitsPagination,
  clearVisits,
} from "@/redux/slices/visitsSlice";
import {
  selectUser,
  selectSelectedCompany,
} from "@/redux/slices/authSlice";
import {
  fetchProjects,
  selectAllProjects,
} from "@/redux/slices/projectsSlice";

interface CreateVisitFormData {
  description: string;
  visitDate: Date | undefined;
  projectId: string;
}

const Photos: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();

  // Redux state
  const visits = useAppSelector(selectAllVisits);
  const loading = useAppSelector(selectVisitsLoading);
  const error = useAppSelector(selectVisitsError);
  const pagination = useAppSelector(selectVisitsPagination);
  const user = useAppSelector(selectUser);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const projects = useAppSelector(selectAllProjects);

  // Local state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateVisitFormData>({
    description: "",
    visitDate: undefined,
    projectId: "",
  });
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterVisitDate, setFilterVisitDate] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  // Sorting
  const [sortBy, setSortBy] = useState<"visitDate" | "photos" | "createdBy">("visitDate");

  // Check permissions
  const canView = hasPermission("photos", "read");
  const canManage = hasPermission("photos", "manage");

  useEffect(() => {
    if (!canView) {
      navigate("/");
      return;
    }

    // Fetch data for the current company
    if (selectedCompany?.id) {
      const filters = {
        projectId: filterProjectId || undefined,
        fromDate: filterVisitDate ? startOfDay(filterVisitDate).toISOString() : undefined,
        toDate: filterVisitDate ? endOfDay(filterVisitDate).toISOString() : undefined,
      };
      dispatch(fetchVisits(filters));
      dispatch(fetchProjects());
    }

    return () => {
      dispatch(clearVisits());
    };
  }, [dispatch, selectedCompany, canView, navigate, filterProjectId, filterVisitDate]);

  // Generate avatar initials
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    return words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Generate avatar colors based on user name
  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-green-100', text: 'text-green-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' },
      { bg: 'bg-pink-100', text: 'text-pink-700' },
      { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      { bg: 'bg-red-100', text: 'text-red-700' },
      { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      { bg: 'bg-teal-100', text: 'text-teal-700' },
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  const handleCreateVisit = async () => {
    if (!createFormData.visitDate || !createFormData.projectId) return;

    try {
      const visitData = {
        description: createFormData.description,
        visitDate: createFormData.visitDate.toISOString(),
        projectId: createFormData.projectId,
      };

      await dispatch(createVisit(visitData));
      
      // Reset form and close dialog
      setCreateFormData({
        description: "",
        visitDate: undefined,
        projectId: "",
      });
      setIsCreateDialogOpen(false);
      
      // Refresh visits list
      dispatch(fetchVisits({}));
    } catch (error) {
      console.error("Failed to create visit:", error);
    }
  };

  const handleVisitClick = (visitId: string) => {
    navigate(`/photos/album/${visitId}`);
  };

  const formatVisitDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const clearFilters = () => {
    setFilterProjectId("");
    setFilterVisitDate(undefined);
  };

  const hasActiveFilters = () => {
    return filterProjectId || filterVisitDate;
  };

  if (!canView) {
    return null;
  }

  // Memoized sorting for visits list based on selected sort
  const sortedVisits = React.useMemo(() => {
    const arr = [...visits];
    switch (sortBy) {
      case "visitDate":
        return arr.sort(
          (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        );
      case "photos":
        return arr.sort(
          (a, b) => (b._count?.photos || 0) - (a._count?.photos || 0)
        );
      case "createdBy": {
        const getName = (v: any) =>
          v.createdBy ? `${v.createdBy.firstName} ${v.createdBy.lastName}` : "";
        return arr.sort((a, b) => getName(a).localeCompare(getName(b)));
      }
      default:
        return arr;
    }
  }, [visits, sortBy]);

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <GlassCard className="p-4 lg:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-filter">Project</Label>
              <Select value={filterProjectId || "all"} onValueChange={(value) => setFilterProjectId(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-date">Visit Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterVisitDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filterVisitDate ? (
                      format(filterVisitDate, "PPP")
                    ) : (
                      <span>Pick visit date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={filterVisitDate}
                    onSelect={(date) => setFilterVisitDate(date || undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitDate">Visit Date</SelectItem>
                  <SelectItem value="photos">Photos Count</SelectItem>
                  <SelectItem value="createdBy">Created By</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* On-site visits section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              On-site visits
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {pagination.total}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visits are, by default, made visible to all stakeholders.
            </p>
          </div>
        </div>

        {/* Mobile controls under the title */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters() && "bg-blue-50 border-blue-200")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters() && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {[filterProjectId, filterVisitDate].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters() && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          {canManage && (
            <ActionButton
              text="Create a visit"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateDialogOpen(true)}
            />
          )}
        </div>

        {/* Desktop controls below the title */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={filterProjectId || "all"} onValueChange={(value) => setFilterProjectId(value === "all" ? "" : value)}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[200px] justify-start text-left font-normal",
                    !filterVisitDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filterVisitDate ? (
                    format(filterVisitDate, "PPP")
                  ) : (
                    <span>Pick visit date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filterVisitDate}
                  onSelect={(date) => setFilterVisitDate(date || undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitDate">Visit Date</SelectItem>
                <SelectItem value="photos">Photos Count</SelectItem>
                <SelectItem value="createdBy">Created By</SelectItem>
              </SelectContent>
            </Select>

            {(filterProjectId || filterVisitDate) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {canManage && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <ActionButton
                  text="Create a visit"
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="inline-flex"
                />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a new visit</DialogTitle>
                  <DialogDescription>
                    Create a new photo album for your site visit. You can add photos after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project">Project</Label>
                    <Select 
                      value={createFormData.projectId} 
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="visitDate">Visit Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !createFormData.visitDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {createFormData.visitDate ? (
                            format(createFormData.visitDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={createFormData.visitDate}
                          onSelect={(date) => setCreateFormData(prev => ({ ...prev, visitDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter visit description..."
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateVisit}
                    disabled={!createFormData.visitDate || !createFormData.projectId}
                  >
                    Create Visit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Visits Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i} className="p-4 sm:p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-20 sm:h-24 bg-gray-200 rounded"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : visits.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">No visits yet</h3>
                <p className="text-gray-500 mt-1">
                  Create your first site visit to start organizing photos.
                </p>
              </div>
              {canManage && (
                <ActionButton
                  text="Create your first visit"
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreateDialogOpen(true)}
                />
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedVisits.map((visit) => {
              const createdBy = visit.createdBy 
                ? `${visit.createdBy.firstName} ${visit.createdBy.lastName}` 
                : "Unknown";
              const avatarColors = getAvatarColors(createdBy);
              
              return (
                <GlassCard 
                  key={visit.id} 
                  className="p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => handleVisitClick(visit.id)}
                >
                  <div className="space-y-3 sm:space-y-4">
                    {/* Visit Date Title */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
                        {formatVisitDate(visit.visitDate)}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    </div>

                    {/* Preview Area */}
                    <div className="h-20 sm:h-24 bg-gray-50 rounded-lg flex items-center justify-center border">
                      {visit._count && visit._count.photos > 0 ? (
                        <div className="text-center">
                          <Image className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">
                            {visit._count.photos} photo{visit._count.photos !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Image className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300 mx-auto mb-1" />
                          <span className="text-xs text-gray-400">No photos yet</span>
                        </div>
                      )}
                    </div>

                    {/* Created By */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                        avatarColors.bg,
                        avatarColors.text
                      )}>
                        {getInitials(createdBy)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          Created by
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {createdBy}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="p-6 border-red-200 bg-red-50">
            <div className="text-center space-y-2">
              <p className="text-red-800 font-medium">Failed to load visits</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => dispatch(fetchVisits({}))}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </PageContainer>
  );
};

export default Photos;