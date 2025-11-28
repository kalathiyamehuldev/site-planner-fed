import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  fetchNotificationCounts,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  createTestNotification,
  selectNotifications,
  selectUnreadNotifications,
  selectReadNotifications,
  selectUnreadCount,
  selectTotalCount,
  selectActiveFilter,
  selectFilteredNotifications,
  setActiveFilter,
} from "@/redux/slices/notificationsSlice";
import { cn } from "@/lib/utils";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import usePermission from "@/hooks/usePermission";
import solar from "@solar-icons/react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const PageHeader = ({ title, subtitle, children, showBackButton, onBackClick }: PageHeaderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const readNotifications = useAppSelector(selectReadNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const totalCount = useAppSelector(selectTotalCount);
  const activeFilter = useAppSelector(selectActiveFilter);
  const filteredNotifications = useAppSelector(selectFilteredNotifications);

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationDropdownOpen) {
      dispatch(fetchNotifications());
    }
  }, [notificationDropdownOpen, dispatch]);

  const handleNotificationClick = (notificationId: string, link?: string) => {
    dispatch(markAsRead(notificationId));
    if (link) {
      navigate(link);
    }
    setNotificationDropdownOpen(false);
    setShowAllNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    dispatch(setActiveFilter(filter));
    // No need to fetch again - filtering happens on frontend
  };

  const handleCreateTestNotification = () => {
    dispatch(createTestNotification());
  };

  const handleViewAll = () => {
    setNotificationDropdownOpen(false);
    setShowAllNotifications(true);
  };

  const { hasPermission } = usePermission();
  const canCreateProject = hasPermission('projects', 'create');
  const canCreateTask = hasPermission('tasks', 'create');
  const canShowPlus = canCreateProject || canCreateTask;

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  };

  return (
    <>
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-6 w-full">
        {/* Page Title */}
        <div className="flex items-center gap-1 sm:gap-2 text-gray-500 min-w-0 flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-gray-100"
              onClick={onBackClick}
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
          )}
          <div className="flex flex-col min-w-0">
            <h1 className="typography-common font-semibold leading-[100%] text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <h4 className=" text-[#4B5563] mt-1">{subtitle}</h4>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Page-specific children */}
          {children}

          {/* Notifications Dropdown */}
          <DropdownMenu
            open={notificationDropdownOpen}
            onOpenChange={setNotificationDropdownOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100 relative"
              >
                <solar.Notifications.Bell color="#1C274C" weight="LineDuotone" className="text-[#3a3a3a] w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2  right-1.5 bg-red-500 text-white font-light text-[9px] rounded-full w-2.5 h-2.5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-w-[90vw] p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Tabs */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex items-center min-w-fit px-3 py-2 text-sm font-medium text-gray-600">
                  {[
                    { label: "All", count: totalCount, filter: 'all' },
                    { label: "Unread", count: unreadCount, filter: 'unread' },
                    { label: "Read", count: totalCount - unreadCount, filter: 'read' },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => handleFilterChange(tab.filter as 'all' | 'unread' | 'read')}
                      className={`flex items-center gap-1.5 rounded-md transition px-3 py-1.5 whitespace-nowrap flex-shrink-0 ${
                        activeFilter === tab.filter
                          ? "text-blue-600 font-semibold"
                          : "hover:text-gray-900 font-normal"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`min-w-[18px] h-[18px] rounded-full text-xs transition flex items-center justify-center ${
                          activeFilter === tab.filter
                            ? "bg-blue-600 text-white font-normal"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {activeFilter === 'unread' && 'No unread notifications'}
                    {activeFilter === 'read' && 'No read notifications'}
                    {activeFilter === 'all' && 'No notifications'}
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border group relative",
                          !notification.read
                            ? "bg-blue-50/50 border-blue-100"
                            : "bg-white border-gray-200"
                        )}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            notification.link
                          )
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 bg-gray-200 w-10 h-10 flex items-center justify-center rounded-full">
                            <solar.Notifications.Bell color="#1C274C" weight="LineDuotone" className="text-[#3a3a3a] w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  New
                                </span>
                              )}
                              {notification.category && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                  {notification.category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            {/* Show related project/task info if available */}
                            {(notification.project || notification.task) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                {notification.project && (
                                  <span className="flex items-center gap-1">
                                    📁 {notification.project.name}
                                  </span>
                                )}
                                {notification.task && (
                                  <span className="flex items-center gap-1">
                                    📋 {notification.task.title}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-2">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.read) {
                                  dispatch(markAsUnread(notification.id));
                                } else {
                                  dispatch(markAsRead(notification.id));
                                }
                              }}
                            >
                              {notification.read ? (
                                <span className="text-xs">↩</span>
                              ) : (
                                <span className="text-xs">✓</span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Add Dropdown */}
          {canShowPlus && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                >
                  <solar.Ui.AddSquare weight="LineDuotone" color="#1C274C" className="h-6 w-6 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canCreateTask && (
                  <DropdownMenuItem onClick={() => setShowTaskDialog(true)}>
                    <solar.Notes.ArchiveMinimalistic className="h-4 w-4 mr-2" />
                    Create Task
                  </DropdownMenuItem>
                )}
                {canCreateProject && (
                  <DropdownMenuItem onClick={() => setShowProjectDialog(true)}>
                    <solar.Tools.Layers className="h-4 w-4 mr-2" />
                    Create Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Header - Visible only on mobile */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-2 mb-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-gray-100"
              onClick={onBackClick}
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {title}
          </h1>
        </div>
        {subtitle && (
          <h4 className="text-[#4B5563] text-sm font-normal ml-1">{subtitle}</h4>
        )}

        {children && (
          <div className="mt-3 flex items-center justify-between mx-auto w-full gap-2 flex-wrap">
            {children}
          </div>
        )}
      </div>

      {/* All Notifications Modal */}
      <Dialog open={showAllNotifications} onOpenChange={setShowAllNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>All Notifications</DialogTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={handleCreateTestNotification}
                >
                  Test Notification
                </Button> */}
              </div>
            </div>
            {/* Filter Tabs */}
            <div className="overflow-x-auto mt-4">
              <div className="flex items-center gap-1 min-w-fit">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('all')}
                >
                  All ({totalCount})
                </Button>
                <Button
                  variant={activeFilter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={activeFilter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('read')}
                >
                  Read ({totalCount - unreadCount})
                </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {activeFilter === 'unread' && 'No unread notifications'}
                {activeFilter === 'read' && 'No read notifications'}
                {activeFilter === 'all' && 'No notifications yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border group relative",
                      !notification.read
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-white border-gray-200"
                    )}
                    onClick={() =>
                      handleNotificationClick(notification.id, notification.link)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              New
                            </span>
                          )}
                          {notification.category && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              {notification.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Show related project/task info if available */}
                        {(notification.project || notification.task) && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            {notification.project && (
                              <span className="flex items-center gap-1">
                                📁 {notification.project.name}
                              </span>
                            )}
                            {notification.task && (
                              <span className="flex items-center gap-1">
                                📋 {notification.task.title}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.read) {
                              dispatch(markAsUnread(notification.id));
                            } else {
                              dispatch(markAsRead(notification.id));
                            }
                          }}
                        >
                          {notification.read ? (
                            <span className="text-xs">↩</span>
                          ) : (
                            <span className="text-xs">✓</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <AddTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectId=""
        fromProject={false}
      />

      {/* Project Dialog */}
      <AddProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        mode="create"
      />
    </>
  );
};
export default PageHeader;
