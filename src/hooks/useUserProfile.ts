import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UserProfile, type Address, type PaymentMethod, type Order } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log(`👤 Fetching profile for user ${userId}`);
      const data = await userService.getProfile(userId);
      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateProfile() {
  const { user, updateUser } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!userId) throw new Error('Not authenticated');
      return userService.updateProfile(userId, data);
    },

    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['user-profile', userId] });

      const previousProfile = queryClient.getQueryData(['user-profile', userId]);

      // Update React Query cache
      queryClient.setQueryData(['user-profile', userId], (old: UserProfile) => ({
        ...old,
        ...newData,
      }));

      // Update Auth context
      updateUser(newData);

      return { previousProfile };
    },

    onSuccess: () => {
      toast.success('Profile updated successfully!');
    },

    onError: (error, _variables, context) => {
      // Rollback
      queryClient.setQueryData(['user-profile', userId], context?.previousProfile);
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });
}

export function useUserAddresses() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-addresses', userId],
    queryFn: async () => {
      if (!userId) return [];
      return userService.getAddresses(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddAddress() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<Address, 'id'>) => {
      if (!userId) throw new Error('Not authenticated');
      return userService.addAddress(userId, address);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
      toast.success('Address added successfully');
    },

    onError: (error) => {
      toast.error('Failed to add address');
      console.error('Add address error:', error);
    },
  });
}

export function useUpdateAddress() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addressId, data }: { addressId: string; data: Partial<Address> }) => {
      if (!userId) throw new Error('Not authenticated');
      return userService.updateAddress(userId, addressId, data);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
      toast.success('Address updated successfully');
    },

    onError: (error) => {
      toast.error('Failed to update address');
      console.error('Update address error:', error);
    },
  });
}

export function useDeleteAddress() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return userService.deleteAddress(userId, addressId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
      toast.success('Address deleted successfully');
    },

    onError: (error) => {
      toast.error('Failed to delete address');
      console.error('Delete address error:', error);
    },
  });
}

export function useUserOrders() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      return userService.getOrders(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPaymentMethods() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['user-payment-methods', userId],
    queryFn: async () => {
      if (!userId) return [];
      return userService.getPaymentMethods(userId);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
