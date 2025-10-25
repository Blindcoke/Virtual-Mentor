'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  useCalendarEvents,
  useCalendarStatus,
  useDisconnectCalendar,
  useDisconnectDrive,
  useDisconnectTasks,
  useDriveDocuments,
  useDriveStatus,
  useTasksList,
  useTasksStatus,
} from '@/hooks/use-integrations';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Session = {
  id: string;
  status: 'scheduled' | 'completed' | 'missed' | 'in-progress';
  timestamp: Date;
  duration?: number;
};

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  scheduleTime: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logOut } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Integrations expanded state
  const [integrationsExpanded, setIntegrationsExpanded] = useState(false);

  const [sessions] = useState<Session[]>([]); // Removed mocked data

  // TanStack Query hooks for integrations
  const { data: calendarStatus } = useCalendarStatus();
  const { data: calendarEventsData } = useCalendarEvents();
  const { data: driveStatus } = useDriveStatus();
  const { data: driveDocumentsData } = useDriveDocuments();
  const { data: tasksStatus } = useTasksStatus();
  const { data: tasksListData } = useTasksList();

  // Mutations
  const disconnectCalendar = useDisconnectCalendar();
  const disconnectDrive = useDisconnectDrive();
  const disconnectTasks = useDisconnectTasks();

  // Fetch user profile from Firestore
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/signup');
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setUserProfile(data);
          setName(data.name);
          setPhone(data.phone);
          setScheduleTime(data.scheduleTime);
        } else {
          setProfileError('User profile not found.');
          router.push('/signup');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setProfileError('Failed to load user profile.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user, authLoading, router]);

  // Handle OAuth callback parameters
  useEffect(() => {
    if (!userProfile) return;

    const calendarConnectedParam = searchParams.get('calendar_connected');
    const calendarErrorParam = searchParams.get('calendar_error');
    const driveConnectedParam = searchParams.get('drive_connected');
    const driveErrorParam = searchParams.get('drive_error');
    const tasksConnectedParam = searchParams.get('tasks_connected');
    const tasksErrorParam = searchParams.get('tasks_error');

    if (calendarConnectedParam === 'true') {
      toast.success('Calendar connected successfully');
      window.history.replaceState({}, '', '/profile');
    }

    if (calendarErrorParam) {
      toast.error(getErrorMessage(calendarErrorParam));
      window.history.replaceState({}, '', '/profile');
    }

    if (driveConnectedParam === 'true') {
      toast.success('Drive connected successfully');
      window.history.replaceState({}, '', '/profile');
    }

    if (driveErrorParam) {
      toast.error(getErrorMessage(driveErrorParam));
      window.history.replaceState({}, '', '/profile');
    }

    if (tasksConnectedParam === 'true') {
      toast.success('Tasks connected successfully');
      window.history.replaceState({}, '', '/profile');
    }

    if (tasksErrorParam) {
      toast.error(getErrorMessage(tasksErrorParam));
      window.history.replaceState({}, '', '/profile');
    }
  }, [searchParams, userProfile]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'access_denied':
        return 'Calendar access was denied. Please try again.';
      case 'no_code':
        return 'No authorization code received.';
      case 'oauth_failed':
        return 'Calendar connection failed. Please try again.';
      default:
        return 'An error occurred while connecting to calendar.';
    }
  };

  const handleManualCall = async () => {
    toast.info('Manual call initiated!');
  };

  const handleConnectCalendar = async () => {
    if (calendarStatus?.connected) {
      disconnectCalendar.mutate();
    } else {
      window.location.href = '/api/calendar/connect';
    }
  };

  const handleConnectDrive = async () => {
    if (driveStatus?.connected) {
      disconnectDrive.mutate();
    } else {
      window.location.href = '/api/drive/connect';
    }
  };

  const handleConnectTasks = async () => {
    if (tasksStatus?.connected) {
      disconnectTasks.mutate();
    } else {
      window.location.href = '/api/tasks/connect';
    }
  };

  const handleSaveSchedule = async () => {
    if (!user || !userProfile) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        timezone: 'Asia/Tokyo', // Japan timezone
        scheduleTime,
      });
      toast.success('Schedule settings saved!');
    } catch (error) {
      console.error('Error saving schedule settings:', error);
      toast.error('Failed to save schedule settings.');
    }
  };

  const handleSignOut = async () => {
    await logOut();
    router.push('/signup');
  };

  const getStatusBadgeVariant = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'default';
      case 'missed':
        return 'destructive';
      case 'scheduled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
        <p className="text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
        <p className="text-red-500">Error: {profileError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FFF9F4' }}>
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/rise.png"
            alt="Rise Logo"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>

        {/* Main Card */}
        <Card className="shadow-none">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{name}</CardTitle>
                <CardDescription className="mt-2">
                  {phone} • Asia/Tokyo (JST)
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Schedule Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="schedule-time" className="text-sm font-medium">
                    Preferred Call Time (JST)
                  </label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>

                <Button variant="outline" onClick={handleSaveSchedule}>Save Schedule</Button>
              </div>
            </div>

            <Separator />

            {/* Integrations Section */}
            <div className="space-y-4">
              <button
                onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {integrationsExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <h3 className="text-lg font-semibold">Integrations</h3>
              </button>

              {integrationsExpanded && (
                <div className="space-y-4">
                  {/* Google Calendar */}
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically schedule calls around your meetings
                        </p>
                      </div>
                      {calendarStatus?.connected && (
                        <Badge variant="default">Connected</Badge>
                      )}
                    </div>

                    <Button
                      onClick={handleConnectCalendar}
                      disabled={disconnectCalendar.isPending}
                      variant={calendarStatus?.connected ? 'destructive' : 'outline'}
                    >
                      {disconnectCalendar.isPending
                        ? 'Processing...'
                        : calendarStatus?.connected
                        ? 'Disconnect Calendar'
                        : 'Connect Google Calendar'}
                    </Button>

                    {calendarStatus?.connected && (calendarEventsData?.events?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Upcoming Events</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(calendarEventsData?.events || []).slice(0, 5).map((event) => (
                            <div key={event.id} className="rounded-md bg-muted p-3 text-sm">
                              <p className="font-medium">{event.summary || 'No title'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.start).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Google Drive */}
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Google Drive</h4>
                        <p className="text-sm text-muted-foreground">
                          Access your Google Docs as notes
                        </p>
                      </div>
                      {driveStatus?.connected && (
                        <Badge variant="default">Connected</Badge>
                      )}
                    </div>

                    <Button
                      onClick={handleConnectDrive}
                      disabled={disconnectDrive.isPending}
                      variant={driveStatus?.connected ? 'destructive' : 'outline'}
                    >
                      {disconnectDrive.isPending
                        ? 'Processing...'
                        : driveStatus?.connected
                        ? 'Disconnect Drive'
                        : 'Connect Google Drive'}
                    </Button>

                    {driveStatus?.connected && (driveDocumentsData?.documents?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Recent Documents</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(driveDocumentsData?.documents || []).slice(0, 5).map((doc) => (
                            <div key={doc.id} className="rounded-md bg-muted p-3 text-sm">
                              <a
                                href={doc.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                {doc.name}
                              </a>
                              <p className="text-xs text-muted-foreground">
                                Modified: {new Date(doc.modifiedTime).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Google Tasks */}
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Google Tasks</h4>
                        <p className="text-sm text-muted-foreground">
                          Sync your tasks and to-do lists
                        </p>
                      </div>
                      {tasksStatus?.connected && (
                        <Badge variant="default">Connected</Badge>
                      )}
                    </div>

                    <Button
                      onClick={handleConnectTasks}
                      disabled={disconnectTasks.isPending}
                      variant={tasksStatus?.connected ? 'destructive' : 'outline'}
                    >
                      {disconnectTasks.isPending
                        ? 'Processing...'
                        : tasksStatus?.connected
                        ? 'Disconnect Tasks'
                        : 'Connect Google Tasks'}
                    </Button>

                    {tasksStatus?.connected && (tasksListData?.tasks?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Your Tasks</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(tasksListData?.tasks || []).slice(0, 10).map((task) => (
                            <div key={task.id} className="rounded-md bg-muted p-3 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p
                                    className={`font-medium ${
                                      task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{task.listName}</p>
                                  {task.due && (
                                    <p className="text-xs text-primary">
                                      Due: {new Date(task.due).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-1">Next Scheduled Call</h4>
                  <p className="text-sm text-muted-foreground">
                    Tomorrow at {scheduleTime}
                  </p>
                </div>

                <Button onClick={handleManualCall} className="w-full">
                  Manual Call Now
                </Button>
              </div>

              {sessions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Sessions</h4>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {session.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {session.timestamp.toLocaleString()}
                          </p>
                        </div>
                        {session.duration && (
                          <p className="text-sm text-muted-foreground">
                            {session.duration} min
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
