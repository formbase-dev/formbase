import { getSession } from '@formbase/auth/server';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@formbase/ui/primitives/tabs';

import { CopyButton } from '~/components/copy-button';
import { api } from '~/lib/trpc/server';

import { EmptyFormState } from '../../dashboard/_components/empty-state';
import { ExportSubmissionsDropDownButton } from './export-submissions-button';
import { FormSettings } from './form-settings';
import { SubmissionsTable } from './submissions-table';

export default async function FormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = await params;
  const [form, formSubmissions] = await Promise.all([
    api.form.get({ formId }),
    api.formData.all({ formId }),
  ]);

  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium md:text-3xl">{form?.title}</h1>

        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-sm font-medium">
            {formId}
          </span>
          <CopyButton text={formId} />
        </div>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          {/* <TabsTrigger value="setup">Setup</TabsTrigger> */}
          {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="my-4">
          {formSubmissions.length < 1 && form?.keys && form.keys.length < 2 ? (
            <EmptyFormState status="submission" />
          ) : (
            <>
              <div className="flex w-full items-center justify-between">
                <span className="text-muted-foreground">
                  Total Submissions: {formSubmissions.length}
                </span>
                <ExportSubmissionsDropDownButton
                  submissions={formSubmissions}
                  formKeys={form?.keys ?? []}
                  formTitle={form?.title ?? ''}
                  honeypotField={form?.honeypotField ?? '_gotcha'}
                />
              </div>
              <SubmissionsTable
                formKeys={form?.keys ?? []}
                submissions={formSubmissions}
              />
            </>
          )}
        </TabsContent>
        {/* <TabsContent value="setup">Change your password here.</TabsContent> */}
        {/* <TabsContent value="analytics">Look at your analytics here</TabsContent> */}
        <TabsContent value="settings" className="my-6">
          <FormSettings form={form} user={session?.user ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
