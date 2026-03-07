import React, { ReactNode } from 'react';
import { Pagination } from './pagination';
import { PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string; // e.g. 'text-right'
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: React.ElementType;
  emptyText?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  keyExtractor: (item: T) => string | number;
  expandedRowId?: string | number | null;
  renderExpandedRow?: (item: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyIcon: EmptyIcon = PackageSearch,
  emptyText = 'ยังไม่มีข้อมูลในระบบ',
  currentPage,
  totalPages,
  onPageChange,
  keyExtractor,
  expandedRowId,
  renderExpandedRow
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className={`px-6 py-4 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
                    กำลังโหลดข้อมูล...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <EmptyIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" strokeWidth={1.5} />
                  <p>{emptyText}</p>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const itemId = keyExtractor(item);
                const isExpanded = expandedRowId === itemId;
                
                return (
                  <React.Fragment key={itemId}>
                    <tr 
                      className={cn(
                        "border-b dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors",
                        isExpanded && "bg-gray-50/50 dark:bg-gray-700/30"
                      )}
                    >
                      {columns.map((col, index) => (
                        <td key={index} className={`px-6 py-4 ${col.className || ''}`}>
                          {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr className="bg-gray-50/30 dark:bg-gray-800/50">
                        <td colSpan={columns.length} className="p-0 border-b dark:border-gray-700">
                          {renderExpandedRow(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages !== undefined && currentPage !== undefined && onPageChange && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
