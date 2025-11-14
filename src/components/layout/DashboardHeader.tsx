import React, { useState, useEffect } from "react";
import { Plus, Bell } from "lucide-react";
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
  markAsRead,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount,
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

interface DashboardHeaderProps {
  title?: string;
}

const DashboardHeader = ({ title = "Dashboard" }: DashboardHeaderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

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

  const handleViewAll = () => {
    setNotificationDropdownOpen(false);
    setShowAllNotifications(true);
  };

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

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const displayNotifications = notificationDropdownOpen
    ? unreadNotifications.slice(0, 5)
    : notifications;

  return (
    <>
      <div className="hidden md:flex items-center justify-between mb-4 sm:mb-10 w-full">
        {/* Page Title */}
        <div className="flex items-center gap-1 sm:gap-2 text-gray-500 min-w-0 flex-1">
          <h1 className="typography-common font-semibold leading-[100%] text-gray-900">
            {title}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100"
              >
                <Plus className="h-5 w-5 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowTaskDialog(true)}>
                Create Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowProjectDialog(true)}>
                Create Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
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
              <ScrollArea className="h-[300px]">
                {unreadNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y">
                    {unreadNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                          !notification.isRead && "bg-blue-50/50"
                        )}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            notification.link
                          )
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {unreadNotifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm text-blue-600 hover:text-blue-700"
                    onClick={handleViewAll}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Header - Visible only on mobile */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-lg font-semibold text-gray-900">
            {title}
          </h1>
        </div>
      </div>

      {/* All Notifications Modal */}
      <Dialog open={showAllNotifications} onOpenChange={setShowAllNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>All Notifications</DialogTitle>
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
            </div>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border",
                      !notification.isRead
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-white border-gray-200"
                    )}
                    onClick={() =>
                      handleNotificationClick(notification.id, notification.link)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {getTimeAgo(notification.createdAt)}
                        </p>
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

export default DashboardHeader;
