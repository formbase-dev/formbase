import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import { getSession } from '@formbase/auth/server';
import { Separator } from '@formbase/ui/primitives/separator';

import { ApiKeysSection } from './api-keys-section';

export const metadata: Metadata = {
  title: 'API Keys | Formbase',
  description: 'Manage your API keys for programmatic access',
};

export default async function ApiKeysPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Manage API keys for programmatic access to your forms and submissions.
        </p>
      </div>
      <Separator />
      <ApiKeysSection />
    </div>
  );
}
