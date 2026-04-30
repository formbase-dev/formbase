'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

import { CaretSortIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertTriangle, CheckCircle, Trash2, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { type RouterOutputs } from '@formbase/api';
import { Badge } from '@formbase/ui/primitives/badge';
import { Button } from '@formbase/ui/primitives/button';
import { Checkbox } from '@formbase/ui/primitives/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@formbase/ui/primitives/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@formbase/ui/primitives/table';
import { formatFileName } from '@formbase/utils';

import { api } from '~/lib/trpc/react';

import { formatSubmissionValue } from './format-submission-value';
import { ImagePreviewDialog } from './image-preview-dialog';

type Submission = RouterOutputs['formData']['all'][number];

type SubmissionsTableProps = {
  formKeys: string[];
  submissions: Submission[];
};

export function SubmissionsTable({
  submissions,
  formKeys,
}: SubmissionsTableProps) {
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const formKeysArray = formKeys.filter((key) => key.length > 0);

  const { mutateAsync: deleteFormSubmission } =
    api.formData.delete.useMutation();

  const { mutateAsync: markAsSpam } = api.formData.markAsSpam.useMutation();

  const handleFormSubmissionDelete = async ({
    submissionId,
  }: {
    submissionId: string;
  }) => {
    await deleteFormSubmission(
      {
        id: submissionId,
      },
      {
        onSuccess: () => {
          router.refresh();

          toast.success('Submission has been deleted', {
            icon: <TrashIcon className="h-4 w-4" />,
          });
        },
      },
    );
  };

  const handleToggleSpam = async ({
    submissionId,
    isSpam,
  }: {
    submissionId: string;
    isSpam: boolean;
  }) => {
    await markAsSpam(
      {
        id: submissionId,
        isSpam,
      },
      {
        onSuccess: () => {
          router.refresh();
          toast.success(isSpam ? 'Marked as spam' : 'Marked as not spam', {
            icon: isSpam ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            ),
          });
        },
      },
    );
  };

  const columns: Array<ColumnDef<Submission>> = [
    {
      id: 'select',
      header: ({ table }) => {
        return (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(value);
            }}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: unknown) => {
            row.toggleSelected(!!value);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    ...formKeysArray.map((submission: string) => {
      if (submission === 'image' || submission === 'file') {
        return {
          accessorKey: submission,
          header: () => {
            return (
              <Button
                variant="ghost"
                className="px-0 py-0 capitalize hover:bg-transparent"
              >
                {submission}
                <CaretSortIcon className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }: { row: Row<Submission> }) => {
            const data = row.original.data;
            const fileUrl = data?.[submission];

            if (typeof fileUrl !== 'string') {
              return null;
            }

            const fileName = formatFileName(fileUrl);

            return (
              <div className="flex items-center">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 underline hover:no-underline"
                >
                  {fileName}
                </a>
                {submission === 'image' && (
                  <ImagePreviewDialog fileName={fileName} imageUrl={fileUrl} />
                )}
              </div>
            );
          },
        };
      }

      return {
        accessorKey: submission,
        header: () => {
          return (
            <Button
              variant="ghost"
              className="px-0 py-0 capitalize hover:bg-transparent"
            >
              {submission}
              <CaretSortIcon className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }: { row: Row<Submission> }) => {
          const data = row.original.data;

          if (!data) {
            return null;
          }

          const value = data[submission];

          return <div>{formatSubmissionValue(value)}</div>;
        },
      };
    }),

    {
      accessorKey: 'createdAt',
      header: () => {
        return (
          <Button
            variant="ghost"
            className="px-0 py-0 capitalize hover:bg-transparent"
          >
            Created At
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      sortingFn: (a, b) => {
        const dateA = new Date(a.original.createdAt);
        const dateB = new Date(b.original.createdAt);
        return dateA.getTime() - dateB.getTime();
      },
      cell: ({ row }: { row: Row<Submission> }) => {
        const date = new Date(row.original.createdAt);
        const dateString = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        const timeString = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        return <div>{dateString + ', ' + timeString}</div>;
      },
    },

    {
      accessorKey: 'isSpam',
      header: () => {
        return (
          <Button variant="ghost" className="px-0 py-0 hover:bg-transparent">
            Status
          </Button>
        );
      },
      cell: ({ row }: { row: Row<Submission> }) => {
        const isSpam = row.original.isSpam;
        if (!isSpam) {
          return null;
        }
        return (
          <Badge variant="destructive" className="text-xs">
            Spam
          </Badge>
        );
      },
    },

    {
      id: 'actions',
      enableHiding: false,
      size: 20,
      cell: ({ row }: { row: Row<Submission> }) => {
        const submissionId = row.original.id;
        const isSpam = row.original.isSpam;

        if (!submissionId) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem
                onClick={() =>
                  handleToggleSpam({ submissionId, isSpam: !isSpam })
                }
              >
                {isSpam ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Mark as not spam
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Mark as spam
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleFormSubmissionDelete({ submissionId })}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: submissions,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableSortingRemoval: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="mt-6 w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            onClick={() => {
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            onClick={() => {
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
