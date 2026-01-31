import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getMyFamily,
  createFamily as createFamilyAPI,
  updateFamily as updateFamilyAPI,
  deleteFamily as deleteFamilyAPI,
  removeFamilyMember as removeFamilyMemberAPI,
  leaveFamily as leaveFamilyAPI,
  sendFamilyInvitation as sendInvitationAPI,
  acceptFamilyInvitation as acceptInvitationAPI,
  getPendingInvitations,
  cancelFamilyInvitation as cancelInvitationAPI,
  type Family,
  type FamilyInvitation,
} from '../services/api';

export const familyKeys = {
  all: ['family'] as const,
  my: () => [...familyKeys.all, 'my'] as const,
  invitations: (familyUuid: string) => [...familyKeys.all, 'invitations', familyUuid] as const,
};

export function useMyFamily() {
  return useQuery({
    queryKey: familyKeys.my(),
    queryFn: getMyFamily,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createFamilyAPI(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Семья создана');
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => updateFamilyAPI(uuid, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Название обновлено');
    },
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteFamilyAPI(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Семья удалена');
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyUuid, userUuid }: { familyUuid: string; userUuid: string }) =>
      removeFamilyMemberAPI(familyUuid, userUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Участник удалён');
    },
  });
}

export function useLeaveFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveFamilyAPI(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Вы покинули семью');
    },
  });
}

export function useSendFamilyInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyUuid, email }: { familyUuid: string; email: string }) =>
      sendInvitationAPI(familyUuid, email),
    onSuccess: (_data, { familyUuid }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.invitations(familyUuid) });
      toast.success('Приглашение отправлено');
    },
  });
}

export function useAcceptFamilyInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitationAPI(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Приглашение принято');
    },
  });
}

export function usePendingInvitations(familyUuid: string | undefined) {
  return useQuery<FamilyInvitation[]>({
    queryKey: familyKeys.invitations(familyUuid || ''),
    queryFn: () => getPendingInvitations(familyUuid!),
    enabled: !!familyUuid,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationUuid: string) => cancelInvitationAPI(invitationUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      toast.success('Приглашение отменено');
    },
  });
}
