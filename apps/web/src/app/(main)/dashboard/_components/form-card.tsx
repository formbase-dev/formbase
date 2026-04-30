'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';
import { formatDistanceToNow } from 'date-fns';
import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { type RouterOutputs } from '@formbase/api';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@formbase/ui/primitives/alert-dialog';
import { Button } from '@formbase/ui/primitives/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@formbase/ui/primitives/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@formbase/ui/primitives/dropdown-menu';

import { CopyButton } from '~/components/copy-button';
import { LoadingButton } from '~/components/loading-button';
import { api } from '~/lib/trpc/react';

type FormCardProp = {
  form: RouterOutputs['form']['userForms'][number];
  submissionsCount: number;
  updatedAt: Date | null;
  createdAt: Date;
};

export function FormCard({
  form,
  submissionsCount,
  createdAt,
  updatedAt,
}: FormCardProp) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const { mutateAsync: deleteForm, isPending: isDeleting } =
    api.form.delete.useMutation();
  const { mutateAsync: duplicateForm, isPending: isDuplicating } =
    api.form.duplicate.useMutation();

  const handleDelete = async () => {
    await deleteForm(
      { id: form.id },
      {
        onSuccess: () => {
          router.refresh();
          toast.success('Your form endpoint has been deleted', {
            icon: <TrashIcon className="h-4 w-4" />,
          });
          setDeleteDialogOpen(false);
        },
      },
    );
  };

  const handleDuplicate = async () => {
    await duplicateForm(
      { id: form.id },
      {
        onSuccess: () => {
          router.refresh();
          toast.success('Form duplicated successfully', {
            icon: <CopyIcon className="h-4 w-4" />,
          });
        },
      },
    );
  };

  return (
    <>
      <Link href={`/form/${form.id}`} className="text-sm underline-offset-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {form.id}
                  </span>
                  <CopyButton text={form.id} />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <span className="sr-only">Open Form Endpoint menu</span>
                    <DotsVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDuplicate();
                    }}
                    disabled={isDuplicating}
                  >
                    <CopyIcon className="mr-2 h-4 w-4" />
                    {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <p className="mb-1 text-sm text-muted-foreground">
              {submissionsCount} submissions
            </p>

            {submissionsCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                {' '}
                Last submission: None yet
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Last submission:{' '}
                {formatDistanceToNow(new Date(updatedAt ?? createdAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form endpoint? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <LoadingButton
              variant="destructive"
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
