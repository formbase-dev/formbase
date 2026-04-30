'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  BellRing,
  ExternalLink,
  FolderPen,
  FolderX,
  Shield,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { type RouterOutputs } from '@formbase/api';
import { type User } from '@formbase/auth';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@formbase/ui/primitives/form';
import { Input } from '@formbase/ui/primitives/input';
import { Label } from '@formbase/ui/primitives/label';
import { Switch } from '@formbase/ui/primitives/switch';

import { LoadingButton } from '~/components/loading-button';
import { api } from '~/lib/trpc/react';

import { revalidateDashboard } from '../../_actions/revalidateDashboard';
import { DeleteFormDialog } from './delete-form-dialog';

const formNameSchema = z.object({
  name: z.string().min(1).optional(),
});

const formReturnUrlSchema = z.object({
  returnUrl: z.string().url().optional(),
});

const enableFormSubmissionsSchema = z.object({
  enableFormSubmissions: z.boolean().default(true).optional(),
});

const enableNotificationsSchema = z.object({
  enableNotifications: z.boolean().default(true).optional(),
});

const defaultSubmissionEmailSchema = z.object({
  defaultSubmissionEmail: z.string().email().optional(),
});

const honeypotFieldSchema = z.object({
  honeypotField: z.string().min(1).optional(),
});

type FormNameSchema = z.infer<typeof formNameSchema>;
type EnableFormSubmissionsSchema = z.infer<typeof enableFormSubmissionsSchema>;
type EnableFormNotificationsSchema = z.infer<typeof enableNotificationsSchema>;
type FormReturnUrlSchema = z.infer<typeof formReturnUrlSchema>;

type DefaultSubmissionEmailSchema = z.infer<
  typeof defaultSubmissionEmailSchema
>;

type FormSettingsProps = {
  form: RouterOutputs['form']['get'];
  user: User | null;
};

export function FormSettings({ form, user }: FormSettingsProps) {
  const router = useRouter();

  if (!form) {
    return null;
  }

  const redirectToDashboard = () => {
    void revalidateDashboard();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-4">
      <FormName formId={form.id} name={form.title} />

      <ReturnUrlForm formId={form.id} returnUrl={form.returnUrl?.toString()} />

      <EnableFormSubmissions
        formId={form.id}
        enableSubmissions={form.enableSubmissions}
      />

      <EnableFormNotifications
        formId={form.id}
        enableNotifications={form.enableEmailNotifications}
      />

      {/* only show the if the user has enabled email notifications */}
      {form.enableEmailNotifications && (
        <FormDefaultSubmissionEmailRecipient
          formId={form.id}
          email={form.defaultSubmissionEmail ?? user?.email ?? ''}
        />
      )}

      <HoneypotFieldSetting
        formId={form.id}
        honeypotField={form.honeypotField}
      />

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Delete Form</Label>
          <p className="text-sm text-muted-foreground">
            Delete your form with all your submissions
          </p>
        </div>
        <div>
          <DeleteFormDialog
            formId={form.id}
            onSuccessfulDelete={redirectToDashboard}
          />
        </div>
      </div>
    </div>
  );
}

const FormName = ({ formId, name }: { formId: string; name: string }) => {
  const router = useRouter();

  const formName = useForm<FormNameSchema>({
    resolver: zodResolver(formNameSchema),
    defaultValues: {
      name,
    },
  });

  const { mutateAsync: updateFormName, isPending: isUpdatingFormName } =
    api.form.update.useMutation();

  async function handleFormNameSubmit(data: FormNameSchema) {
    try {
      await updateFormName({
        id: formId,
        title: data.name,
      });

      toast('Your form name has been updated', {
        icon: <FolderPen className="h-4 w-4" />,
      });

      router.refresh();
    } catch {
      toast('Failed to update form name', {
        description: 'Please try again later',
        icon: <FolderX className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...formName}>
      <form onSubmit={formName.handleSubmit(handleFormNameSubmit)}>
        <FormField
          control={formName.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Form Name</FormLabel>
                <FormDescription>This is the name of your form</FormDescription>
              </div>
              <FormControl>
                <div className="flex gap-2">
                  <Input className="w-[250px]" {...field} min={1} />
                  <LoadingButton
                    loading={isUpdatingFormName}
                    type="submit"
                    variant="default"
                  >
                    Save
                  </LoadingButton>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
const ReturnUrlForm = ({
  formId,
  returnUrl,
}: {
  formId: string;
  returnUrl: string | undefined;
}) => {
  const router = useRouter();

  const formReturnUrl = useForm<FormReturnUrlSchema>({
    resolver: zodResolver(formReturnUrlSchema),
    defaultValues: {
      returnUrl,
    },
  });

  const {
    mutateAsync: updateFormReturnURL,
    isPending: isUpdatingFormReturnURL,
  } = api.form.update.useMutation();

  async function handleReturnURLSubmit(data: FormReturnUrlSchema) {
    try {
      await updateFormReturnURL({
        id: formId,
        returnUrl: data.returnUrl,
      });

      toast('Your form name has been updated', {
        icon: <ExternalLink className="h-4 w-4" />,
      });

      router.refresh();
    } catch {
      toast('Failed to update form name', {
        description: 'Please try again later',
        icon: <ExternalLink className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...formReturnUrl}>
      <form onSubmit={formReturnUrl.handleSubmit(handleReturnURLSubmit)}>
        <FormField
          control={formReturnUrl.control}
          name="returnUrl"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Return URL</FormLabel>
                <FormDescription>
                  URL where users will be redirected after submitting the form
                </FormDescription>
              </div>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    className="w-[250px]"
                    {...field}
                    placeholder="Enter return url here"
                    type="url"
                  />
                  <LoadingButton
                    loading={isUpdatingFormReturnURL}
                    type="submit"
                    variant="default"
                  >
                    Save
                  </LoadingButton>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

const FormDefaultSubmissionEmailRecipient = ({
  formId,
  email,
}: {
  formId: string;
  email: string;
}) => {
  const router = useRouter();

  const formDefaultSubmissionEmail = useForm<DefaultSubmissionEmailSchema>({
    resolver: zodResolver(defaultSubmissionEmailSchema),
    defaultValues: {
      defaultSubmissionEmail: email,
    },
  });

  const {
    mutateAsync: updateFormDefaultSubmissionEmail,
    isPending: isUpdatingFormDefaultSubmissionEmail,
  } = api.form.update.useMutation();

  async function handleFormDefaultSubmissionEmailSubmit(
    data: DefaultSubmissionEmailSchema,
  ) {
    try {
      await updateFormDefaultSubmissionEmail({
        id: formId,
        defaultSubmissionEmail: data.defaultSubmissionEmail,
      });

      toast('Your form default submission email has been updated', {
        icon: <FolderPen className="h-4 w-4" />,
      });

      router.refresh();
    } catch {
      toast('Failed to update form', {
        description: 'Please try again later',
        icon: <FolderX className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...formDefaultSubmissionEmail}>
      <form
        onSubmit={formDefaultSubmissionEmail.handleSubmit(
          handleFormDefaultSubmissionEmailSubmit,
        )}
      >
        <FormField
          control={formDefaultSubmissionEmail.control}
          name="defaultSubmissionEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Default Submission Email
                </FormLabel>
                <FormDescription>
                  This is the email address that submission emails will be sent
                  to
                </FormDescription>
              </div>
              <FormControl>
                <div className="flex gap-2">
                  <Input className="w-[250px]" {...field} min={1} />
                  <LoadingButton
                    loading={isUpdatingFormDefaultSubmissionEmail}
                    type="submit"
                    variant="default"
                  >
                    Save
                  </LoadingButton>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

const EnableFormSubmissions = ({
  formId,
  enableSubmissions,
}: {
  formId: string;
  enableSubmissions: boolean;
}) => {
  const router = useRouter();

  const enableSubmissionsForm = useForm<EnableFormSubmissionsSchema>({
    resolver: zodResolver(enableFormSubmissionsSchema),
    defaultValues: {
      enableFormSubmissions: enableSubmissions,
    },
  });

  const { mutateAsync: updateFormSubmissions, isPending: isUpdatingForm } =
    api.form.update.useMutation();

  async function handleEnableSubmissionsRetentionSubmit(
    data: EnableFormSubmissionsSchema,
  ) {
    try {
      await updateFormSubmissions({
        id: formId,
        enableSubmissions: data.enableFormSubmissions,
      });

      toast(
        data.enableFormSubmissions
          ? 'Your form is now accepting submissions'
          : 'Your form is no longer accepting submissions',
        {
          icon: <FolderPen className="h-4 w-4" />,
        },
      );

      router.refresh();
    } catch {
      toast('Failed to update form', {
        description: 'Please try again later',
        icon: <FolderX className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...enableSubmissionsForm}>
      <FormField
        control={enableSubmissionsForm.control}
        name="enableFormSubmissions"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Enable Form Submissions
              </FormLabel>
              <FormDescription>
                Turn off this option to prevent your form from accepting new
                submissions
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={async (isChecked) => {
                  field.onChange(isChecked);
                  await handleEnableSubmissionsRetentionSubmit({
                    enableFormSubmissions: isChecked,
                  });
                }}
                disabled={isUpdatingForm}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
};
const EnableFormNotifications = ({
  formId,
  enableNotifications,
}: {
  formId: string;
  enableNotifications: boolean;
}) => {
  const router = useRouter();

  const enableNotificationsForm = useForm<EnableFormNotificationsSchema>({
    resolver: zodResolver(enableNotificationsSchema),
    defaultValues: {
      enableNotifications: enableNotifications,
    },
  });

  const { mutateAsync: updateFormNotifications, isPending: isUpdatingForm } =
    api.form.update.useMutation();

  async function handleEnableSubmissionsNotifications(
    data: EnableFormNotificationsSchema,
  ) {
    try {
      await updateFormNotifications({
        id: formId,
        enableEmailNotifications: data.enableNotifications,
      });

      toast(
        data.enableNotifications
          ? 'You will now receive email notifications for new submissions'
          : 'You will no longer receive email notifications for new submissions',
        {
          icon: <BellRing className="h-4 w-4" />,
        },
      );

      router.refresh();
    } catch {
      toast('Failed to update form', {
        description: 'Please try again later',
        icon: <BellRing className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...enableNotificationsForm}>
      <FormField
        control={enableNotificationsForm.control}
        name="enableNotifications"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Enable Form Submission Notifications
              </FormLabel>
              <FormDescription>
                Turn off this option to prevent your form from sending you email
                notifications for new submissions
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={async (isChecked) => {
                  field.onChange(isChecked);
                  await handleEnableSubmissionsNotifications({
                    enableNotifications: isChecked,
                  });
                }}
                disabled={isUpdatingForm}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
};

type HoneypotFieldSchema = z.infer<typeof honeypotFieldSchema>;

const HoneypotFieldSetting = ({
  formId,
  honeypotField,
}: {
  formId: string;
  honeypotField: string;
}) => {
  const router = useRouter();

  const honeypotFieldForm = useForm<HoneypotFieldSchema>({
    resolver: zodResolver(honeypotFieldSchema),
    defaultValues: {
      honeypotField,
    },
  });

  const { mutateAsync: updateHoneypotField, isPending: isUpdating } =
    api.form.update.useMutation();

  async function handleHoneypotFieldSubmit(data: HoneypotFieldSchema) {
    try {
      await updateHoneypotField({
        id: formId,
        honeypotField: data.honeypotField,
      });

      toast('Honeypot field name has been updated', {
        icon: <Shield className="h-4 w-4" />,
      });

      router.refresh();
    } catch {
      toast('Failed to update honeypot field', {
        description: 'Please try again later',
        icon: <FolderX className="h-4 w-4" />,
      });
    }
  }

  return (
    <Form {...honeypotFieldForm}>
      <form
        onSubmit={honeypotFieldForm.handleSubmit(handleHoneypotFieldSubmit)}
      >
        <FormField
          control={honeypotFieldForm.control}
          name="honeypotField"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Honeypot Field Name</FormLabel>
                <FormDescription>
                  Hidden field used for spam detection. Bots fill this field,
                  humans don&apos;t.
                </FormDescription>
              </div>
              <FormControl>
                <div className="flex gap-2">
                  <Input className="w-[250px]" {...field} min={1} />
                  <LoadingButton
                    loading={isUpdating}
                    type="submit"
                    variant="default"
                  >
                    Save
                  </LoadingButton>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
