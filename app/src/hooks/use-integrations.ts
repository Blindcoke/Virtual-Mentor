import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
};

export type DriveDocument = {
  id: string;
  name: string;
  modifiedTime: string;
  link?: string;
};

export type Task = {
  id: string;
  title: string;
  listName: string;
  status: string;
  due?: string;
  notes?: string;
};

type CalendarStatusResponse = {
  connected: boolean;
  calendars?: Array<{ id: string; summary: string }>;
};

type CalendarEventsResponse = {
  events: CalendarEvent[];
};

type DriveStatusResponse = {
  connected: boolean;
};

type DriveDocumentsResponse = {
  documents: DriveDocument[];
};

type TasksStatusResponse = {
  connected: boolean;
};

type TasksListResponse = {
  tasks: Task[];
};

// Query Keys
export const integrationKeys = {
  calendar: {
    status: ['calendar', 'status'] as const,
    events: (startDate?: string, endDate?: string) =>
      ['calendar', 'events', { startDate, endDate }] as const,
  },
  drive: {
    status: ['drive', 'status'] as const,
    documents: ['drive', 'documents'] as const,
  },
  tasks: {
    status: ['tasks', 'status'] as const,
    list: ['tasks', 'list'] as const,
  },
};

// Calendar Hooks
export function useCalendarStatus() {
  return useQuery({
    queryKey: integrationKeys.calendar.status,
    queryFn: async (): Promise<CalendarStatusResponse> => {
      const response = await fetch('/api/calendar/status');
      if (!response.ok) {
        throw new Error('Failed to check calendar status');
      }
      return response.json();
    },
  });
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { data: statusData } = useCalendarStatus();

  return useQuery({
    queryKey: integrationKeys.calendar.events(startDate, endDate),
    queryFn: async (): Promise<CalendarEventsResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/calendar/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    },
    enabled: statusData?.connected ?? false,
  });
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect calendar');
      }

      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: integrationKeys.calendar.status });

      // Optimistically update to disconnected state
      queryClient.setQueryData(integrationKeys.calendar.status, { connected: false });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: integrationKeys.calendar.status });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      toast.success('Calendar disconnected successfully');
    },
    onError: (error) => {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: integrationKeys.calendar.status });
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect calendar');
    },
  });
}

// Drive Hooks
export function useDriveStatus() {
  return useQuery({
    queryKey: integrationKeys.drive.status,
    queryFn: async (): Promise<DriveStatusResponse> => {
      const response = await fetch('/api/drive/status');
      if (!response.ok) {
        throw new Error('Failed to check Drive status');
      }
      return response.json();
    },
  });
}

export function useDriveDocuments() {
  const { data: statusData } = useDriveStatus();

  return useQuery({
    queryKey: integrationKeys.drive.documents,
    queryFn: async (): Promise<DriveDocumentsResponse> => {
      const response = await fetch('/api/drive/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch Drive documents');
      }
      return response.json();
    },
    enabled: statusData?.connected ?? false,
  });
}

export function useDisconnectDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/drive/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Drive');
      }

      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: integrationKeys.drive.status });
      queryClient.setQueryData(integrationKeys.drive.status, { connected: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.drive.status });
      queryClient.invalidateQueries({ queryKey: integrationKeys.drive.documents });
      toast.success('Drive disconnected successfully');
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.drive.status });
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect Drive');
    },
  });
}

// Tasks Hooks
export function useTasksStatus() {
  return useQuery({
    queryKey: integrationKeys.tasks.status,
    queryFn: async (): Promise<TasksStatusResponse> => {
      const response = await fetch('/api/tasks/status');
      if (!response.ok) {
        throw new Error('Failed to check Tasks status');
      }
      return response.json();
    },
  });
}

export function useTasksList() {
  const { data: statusData } = useTasksStatus();

  return useQuery({
    queryKey: integrationKeys.tasks.list,
    queryFn: async (): Promise<TasksListResponse> => {
      const response = await fetch('/api/tasks/list');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
    enabled: statusData?.connected ?? false,
  });
}

export function useDisconnectTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tasks/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Tasks');
      }

      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: integrationKeys.tasks.status });
      queryClient.setQueryData(integrationKeys.tasks.status, { connected: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.tasks.status });
      queryClient.invalidateQueries({ queryKey: integrationKeys.tasks.list });
      toast.success('Tasks disconnected successfully');
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.tasks.status });
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect Tasks');
    },
  });
}
