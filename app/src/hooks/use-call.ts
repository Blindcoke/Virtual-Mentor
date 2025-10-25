import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

type InitiateCallRequest = {
  phoneNumber: string;
  userId?: string;
  userName?: string;
};

type InitiateCallResponse = {
  success: boolean;
  roomName: string;
  phoneNumber: string;
  roomUrl: string;
  sipParticipant: {
    participantId: string;
    participantIdentity: string;
    roomName: string;
  };
  agentToken: string;
  message: string;
};

export function useInitiateCall() {
  return useMutation({
    mutationFn: async (data: InitiateCallRequest): Promise<InitiateCallResponse> => {
      const response = await fetch('/api/call/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate call');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Call initiated successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate call');
    },
  });
}
