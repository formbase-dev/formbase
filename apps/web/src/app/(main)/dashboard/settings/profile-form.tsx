'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { type User } from '@formbase/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@formbase/ui/primitives/form';
import { Input } from '@formbase/ui/primitives/input';

import { LoadingButton } from '~/components/loading-button';
import { api } from '~/lib/trpc/react';

const profileFormSchema = z.object({
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  name: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileFormUser = Omit<User, 'name'> & { name: string | null };

type ProfileFormProps = {
  user: ProfileFormUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name ?? '',
      email: user.email,
    },
    mode: 'onChange',
  });

  const router = useRouter();

  const { mutateAsync: updateUser, isPending: isUpdatingUser } =
    api.user.update.useMutation();

  const handleUpdateUser = async (data: ProfileFormValues) => {
    await updateUser(
      {
        id: user.id,
        name: data.name,
      },
      {
        onSuccess: () => {
          router.refresh();
          toast.success('Your name has been updated', {
            icon: <UserCheck className="h-4 w-4" />,
          });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleUpdateUser)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Steve Jobs"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="steve@apple.com" disabled {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton type="submit" loading={isUpdatingUser}>
          Update Profile
        </LoadingButton>
      </form>
    </Form>
  );
}
