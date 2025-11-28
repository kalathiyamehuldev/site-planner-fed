import React, { useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchPreferences, 
  updatePreferences, 
  selectNotificationPreferences, 
  selectPreferencesLoading 
} from '@/redux/slices/notificationPreferencesSlice';
import solar from '@solar-icons/react';

const NotificationPreferences = () => {
  const dispatch = useAppDispatch();
  const prefs = useAppSelector(selectNotificationPreferences);
  const loading = useAppSelector(selectPreferencesLoading);

  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);

  const onToggle = (key: 'email' | 'push' | 'inApp', value: boolean) => {
    dispatch(updatePreferences({ [key]: value }));
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage notification channels" />
      <div className="max-w-3xl mr-auto">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <solar.Settings.SettingsMinimalistic className="h-5 w-5 text-[#1b78f9]" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                <div>
                  <h4 className='font-bold'>Email</h4>
                  <h5>Receive updates via email</h5>
                </div>
                <Switch 
                  checked={prefs.email}
                  onCheckedChange={(v) => onToggle('email', !!v)}
                  className="data-[state=checked]:bg-[#1b78f9]"
                  aria-label="Email notifications"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                <div>
                  <h4 className='font-bold'>Push</h4>
                  <h5>Mobile push alerts</h5>
                </div>
                <Switch 
                  checked={prefs.push}
                  onCheckedChange={(v) => onToggle('push', !!v)}
                  className="data-[state=checked]:bg-[#1b78f9]"
                  aria-label="Push notifications"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                <div>
                  <h4 className='font-bold'>In-App</h4>
                  <h5>Alerts inside the app</h5>
                </div>
                <Switch 
                  checked={prefs.inApp}
                  onCheckedChange={(v) => onToggle('inApp', !!v)}
                  className="data-[state=checked]:bg-[#1b78f9]"
                  aria-label="In app notifications"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default NotificationPreferences;
