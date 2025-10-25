'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Session = {
  id: string;
  status: 'scheduled' | 'completed' | 'missed' | 'in-progress';
  timestamp: Date;
  duration?: number;
};

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
};

type DriveDocument = {
  id: string;
  name: string;
  modifiedTime: string;
  link?: string;
};

type Task = {
  id: string;
  title: string;
  listName: string;
  status: string;
  due?: string;
  notes?: string;
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [name] = useState('John Doe');
  const [timezone, setTimezone] = useState('America/New_York');
  const [phone] = useState('+1 (555) 123-4567');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveDocuments, setDriveDocuments] = useState<DriveDocument[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Tasks state
  const [tasksConnected, setTasksConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [sessions] = useState<Session[]>([
    { id: '1', status: 'completed', timestamp: new Date('2025-10-24T10:00:00'), duration: 15 },
    { id: '2', status: 'completed', timestamp: new Date('2025-10-23T10:00:00'), duration: 12 },
    { id: '3', status: 'missed', timestamp: new Date('2025-10-22T10:00:00') },
  ]);

  // Check all connections on mount
  useEffect(() => {
    checkCalendarStatus();
    checkDriveStatus();
    checkTasksStatus();

    // Handle OAuth callback parameters
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');
    const driveConnected = searchParams.get('drive_connected');
    const driveError = searchParams.get('drive_error');
    const tasksConnected = searchParams.get('tasks_connected');
    const tasksError = searchParams.get('tasks_error');

    if (calendarConnected === 'true') {
      setCalendarConnected(true);
      fetchCalendarEvents();
      window.history.replaceState({}, '', '/profile');
    }

    if (calendarError) {
      setCalendarError(getErrorMessage(calendarError));
      window.history.replaceState({}, '', '/profile');
    }

    if (driveConnected === 'true') {
      setDriveConnected(true);
      fetchDriveDocuments();
      window.history.replaceState({}, '', '/profile');
    }

    if (driveError) {
      setDriveError(getErrorMessage(driveError));
      window.history.replaceState({}, '', '/profile');
    }

    if (tasksConnected === 'true') {
      setTasksConnected(true);
      fetchTasks();
      window.history.replaceState({}, '', '/profile');
    }

    if (tasksError) {
      setTasksError(getErrorMessage(tasksError));
      window.history.replaceState({}, '', '/profile');
    }
  }, [searchParams]);

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

  const checkCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setCalendarConnected(data.connected);

      if (data.connected) {
        fetchCalendarEvents();
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events');
      if (response.ok) {
        const data = await response.json();
        setCalendarEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    }
  };

  const handleManualCall = async () => {
    // TODO: Implement manual call trigger
    alert('Manual call initiated!');
  };

  const handleConnectCalendar = async () => {
    if (calendarConnected) {
      setIsLoadingCalendar(true);
      try {
        const response = await fetch('/api/calendar/disconnect', {
          method: 'POST',
        });

        if (response.ok) {
          setCalendarConnected(false);
          setCalendarEvents([]);
          setCalendarError(null);
        } else {
          setCalendarError('Failed to disconnect calendar');
        }
      } catch (error) {
        console.error('Failed to disconnect calendar:', error);
        setCalendarError('Failed to disconnect calendar');
      } finally {
        setIsLoadingCalendar(false);
      }
    } else {
      window.location.href = '/api/calendar/connect';
    }
  };

  // Drive functions
  const checkDriveStatus = async () => {
    try {
      const response = await fetch('/api/drive/status');
      const data = await response.json();
      setDriveConnected(data.connected);

      if (data.connected) {
        fetchDriveDocuments();
      }
    } catch (error) {
      console.error('Failed to check drive status:', error);
    }
  };

  const fetchDriveDocuments = async () => {
    try {
      const response = await fetch('/api/drive/documents');
      if (response.ok) {
        const data = await response.json();
        setDriveDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch drive documents:', error);
    }
  };

  const handleConnectDrive = async () => {
    if (driveConnected) {
      setIsLoadingDrive(true);
      try {
        const response = await fetch('/api/drive/disconnect', {
          method: 'POST',
        });

        if (response.ok) {
          setDriveConnected(false);
          setDriveDocuments([]);
          setDriveError(null);
        } else {
          setDriveError('Failed to disconnect Drive');
        }
      } catch (error) {
        console.error('Failed to disconnect drive:', error);
        setDriveError('Failed to disconnect Drive');
      } finally {
        setIsLoadingDrive(false);
      }
    } else {
      window.location.href = '/api/drive/connect';
    }
  };

  // Tasks functions
  const checkTasksStatus = async () => {
    try {
      const response = await fetch('/api/tasks/status');
      const data = await response.json();
      setTasksConnected(data.connected);

      if (data.connected) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to check tasks status:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/list');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleConnectTasks = async () => {
    if (tasksConnected) {
      setIsLoadingTasks(true);
      try {
        const response = await fetch('/api/tasks/disconnect', {
          method: 'POST',
        });

        if (response.ok) {
          setTasksConnected(false);
          setTasks([]);
          setTasksError(null);
        } else {
          setTasksError('Failed to disconnect Tasks');
        }
      } catch (error) {
        console.error('Failed to disconnect tasks:', error);
        setTasksError('Failed to disconnect Tasks');
      } finally {
        setIsLoadingTasks(false);
      }
    } else {
      window.location.href = '/api/tasks/connect';
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {name}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{phone}</span>
                <span>•</span>
                <span>{timezone}</span>
              </div>
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Sign Out
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Schedule Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Schedule Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Call Time
                  </label>
                  <input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                  Save Schedule
                </button>
              </div>
            </div>

            {/* Calendar Connection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Calendar Integration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect your calendar to automatically schedule calls around your meetings.
              </p>

              {calendarError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{calendarError}</p>
                </div>
              )}

              <button
                onClick={handleConnectCalendar}
                disabled={isLoadingCalendar}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isLoadingCalendar
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : calendarConnected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoadingCalendar
                  ? 'Processing...'
                  : calendarConnected
                  ? 'Disconnect Calendar'
                  : 'Connect Google Calendar'}
              </button>

              {calendarConnected && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                    ✓ Google Calendar connected
                  </p>

                  {calendarEvents.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Upcoming Events (Next 7 days)
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {calendarEvents.slice(0, 10).map((event) => (
                          <div
                            key={event.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">
                              {event.summary || 'No title'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(event.start).toLocaleString()}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                📍 {event.location}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Drive Integration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Google Drive (Notes)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Access your Google Docs as notes for the AI mentor.
              </p>

              {driveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{driveError}</p>
                </div>
              )}

              <button
                onClick={handleConnectDrive}
                disabled={isLoadingDrive}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isLoadingDrive
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : driveConnected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoadingDrive
                  ? 'Processing...'
                  : driveConnected
                  ? 'Disconnect Drive'
                  : 'Connect Google Drive'}
              </button>

              {driveConnected && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                    ✓ Google Drive connected
                  </p>

                  {driveDocuments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Recent Documents
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {driveDocuments.slice(0, 10).map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                          >
                            <a
                              href={doc.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {doc.name}
                            </a>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Modified: {new Date(doc.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Tasks Integration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Google Tasks
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sync your tasks and to-do lists.
              </p>

              {tasksError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{tasksError}</p>
                </div>
              )}

              <button
                onClick={handleConnectTasks}
                disabled={isLoadingTasks}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isLoadingTasks
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : tasksConnected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoadingTasks
                  ? 'Processing...'
                  : tasksConnected
                  ? 'Disconnect Tasks'
                  : 'Connect Google Tasks'}
              </button>

              {tasksConnected && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                    ✓ Google Tasks connected
                  </p>

                  {tasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Your Tasks
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tasks.slice(0, 15).map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`font-medium ${
                                  task.status === 'completed'
                                    ? 'line-through text-gray-500 dark:text-gray-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {task.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {task.listName}
                                </p>
                                {task.due && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Due: {new Date(task.due).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                task.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Sessions
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {session.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {session.duration && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.duration} min
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <button
                onClick={handleManualCall}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                Manual Call Now
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Next Scheduled Call
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tomorrow at {scheduleTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
