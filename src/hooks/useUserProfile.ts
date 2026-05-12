import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UserProfile, type Address } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useUserProfile() {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['user-profile', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      console.log(`👤 Fetching profile for user ${userEmail}`);
      const data = await userService.getProfile(userEmail);
      return data as UserProfile;
    },
    enabled: !!userEmail,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateProfile() {
  const { user, updateUser } = useAuth();
  const userEmail = user?.email;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!userEmail) throw new Error('Not authenticated');
      return userService.updateProfile(userEmail, data);
    },

    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['user-profile', userEmail] });

      const previousProfile = queryClient.getQueryData(['user-profile', userEmail]);

      // Update React Query cache
      queryClient.setQueryData(['user-profile', userEmail], (old: UserProfile) => ({
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
      queryClient.setQueryData(['user-profile', userEmail], context?.previousProfile);
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userEmail] });
    },
  });
}

export function useUserAddresses() {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['user-addresses', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return userService.getAddresses(userEmail);
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddAddress() {
  const { user } = useAuth();
  const userEmail = user?.email;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<Address, 'id'>) => {
      if (!userEmail) throw new Error('Not authenticated');
      return userService.addAddress(userEmail, address);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userEmail] });
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
  const userEmail = user?.email;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addressId, data }: { addressId: string; data: Partial<Address> }) => {
      if (!userEmail) throw new Error('Not authenticated');
      return userService.updateAddress(userEmail, addressId, data);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userEmail] });
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
  const userEmail = user?.email;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!userEmail) throw new Error('Not authenticated');
      return userService.deleteAddress(userEmail, addressId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', userEmail] });
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
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['user-orders', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return userService.getOrders(userEmail);
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPaymentMethods() {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['user-payment-methods', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return userService.getPaymentMethods(userEmail);
    },
    enabled: !!userEmail,
    staleTime: 10 * 60 * 1000,
  });
}
