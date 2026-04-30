'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@formbase/ui/primitives/alert-dialog';
import { Button } from '@formbase/ui/primitives/button';
import { Calendar } from '@formbase/ui/primitives/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@formbase/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@formbase/ui/primitives/form';
import { Input } from '@formbase/ui/primitives/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@formbase/ui/primitives/popover';
import { cn } from '@formbase/ui/utils/cn';

import { CopyButton } from '~/components/copy-button';
import { LoadingButton } from '~/components/loading-button';
import { api } from '~/lib/trpc/react';

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresAt: z.date().optional(),
});

type CreateKeyFormValues = z.infer<typeof createKeySchema>;

export function ApiKeysSection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: apiKeys, isLoading } = api.apiKeys.list.useQuery();

  const form = useForm<CreateKeyFormValues>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      name: '',
    },
  });

  const { mutateAsync: createKey, isPending: isCreating } =
    api.apiKeys.create.useMutation({
      onSuccess: (data) => {
        setNewKeyValue(data.key);
        setCreateDialogOpen(false);
        form.reset();
        void utils.apiKeys.list.invalidate();
        toast.success('API key created');
      },
    });

  const { mutateAsync: deleteKey, isPending: isDeleting } =
    api.apiKeys.delete.useMutation({
      onSuccess: () => {
        setDeleteKeyId(null);
        void utils.apiKeys.list.invalidate();
        toast.success('API key deleted');
      },
    });

  const handleCreateKey = async (data: CreateKeyFormValues) => {
    await createKey({ name: data.name, expiresAt: data.expiresAt });
  };

  const handleDeleteKey = async () => {
    if (deleteKeyId) {
      await deleteKey({ id: deleteKeyId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          API keys allow programmatic access to your forms and submissions.
        </p>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your API key a name to help you identify it later.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateKey)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiration (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>No expiration</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <LoadingButton type="submit" loading={isCreating}>
                    Create Key
                  </LoadingButton>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys && apiKeys.length > 0 ? (
        <div className="divide-y rounded-lg border">
          {apiKeys.map((apiKey) => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              onDelete={() => {
                setDeleteKeyId(apiKey.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <KeyRound className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            No API keys yet. Create one to get started.
          </p>
        </div>
      )}

      <Dialog
        open={!!newKeyValue}
        onOpenChange={() => {
          setNewKeyValue(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm">
            <code className="flex-1 break-all">{newKeyValue}</code>
            {newKeyValue && <CopyButton text={newKeyValue} />}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setNewKeyValue(null);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteKeyId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteKeyId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot
              be undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ApiKeyRowProps {
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
  };
  onDelete: () => void;
}

function ApiKeyRow({ apiKey, onDelete }: ApiKeyRowProps) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const { data: usageStats } = api.apiKeys.getUsageStats.useQuery({
    id: apiKey.id,
  });

  return (
    <div className="flex items-center justify-between p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{apiKey.name}</span>
          {isExpired && (
            <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
              Expired
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5">
            {apiKey.keyPrefix}...
          </code>
          <span>
            Created {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
          </span>
          {apiKey.lastUsedAt && (
            <span>
              Last used {format(new Date(apiKey.lastUsedAt), 'MMM d, yyyy')}
            </span>
          )}
          {apiKey.expiresAt && !isExpired && (
            <span>
              Expires {format(new Date(apiKey.expiresAt), 'MMM d, yyyy')}
            </span>
          )}
          {usageStats && (
            <span>
              {usageStats.total} requests ({usageStats.last24h} last 24h)
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
