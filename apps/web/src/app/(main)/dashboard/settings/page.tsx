import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import { getSession } from '@formbase/auth/server';
import { Separator } from '@formbase/ui/primitives/separator';

import { ProfileForm } from './profile-form';

export const metadata: Metadata = {
  title: 'Settings | Formbase',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your profile settings.
        </p>
      </div>
      <Separator />
      <ProfileForm user={session.user} />
    </div>
  );
}
