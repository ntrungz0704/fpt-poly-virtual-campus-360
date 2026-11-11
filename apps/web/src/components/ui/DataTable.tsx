"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EmptyState, LoadingState } from "./StateFeedback";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = "Chưa có dữ liệu phù hợp",
  emptyDescription = "Thử thay đổi bộ lọc hoặc tạo bản ghi mới.",
  emptyActionLabel,
  onEmptyAction,
  toolbar,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("ui-card overflow-hidden flex flex-col", className)}>
      {toolbar && (
        <div className="p-4 border-b border-surface-container bg-surface-container-lowest">
          {toolbar}
        </div>
      )}

      <div className="min-h-[380px] sm:min-h-[440px] flex flex-col flex-1">
        {loading ? (
          <div className="p-4">
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon="table_rows"
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction}
              className="w-full max-w-md"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="sm:hidden px-3 py-1.5 bg-surface-container-low/70 border-b border-surface-container text-[11px] font-medium text-secondary flex items-center justify-end gap-1">
              <span>Vuốt ngang để xem đủ cột</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                swipe_left
              </span>
            </div>
            <div className="overflow-x-auto scrollbar-thin flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        scope="col"
                        className={cn(
                          "px-3 lg:px-4 py-3 type-caption uppercase text-secondary whitespace-nowrap",
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left",
                          col.className
                        )}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {data.map((row) => (
                    <tr
                      key={rowKey(row)}
                      className="bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-3 lg:px-4 py-3.5 text-sm text-on-surface align-middle",
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left",
                            col.className
                          )}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
