import { useState, useCallback } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  onRowClick?: (row: T) => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  onRowClick,
  onSearch,
  onPageChange,
  actions,
  isLoading,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  return (
    <div className="w-full">
      {/* Toolbar: Search + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        {onSearch ? (
          <input
            type="text"
            placeholder="Search…"
            className="input input-bordered input-sm w-full sm:w-64"
            onChange={(e) => onSearch(e.target.value)}
            data-testid="datatable-search"
          />
        ) : (
          <div />
        )}
        {actions && <div className="flex gap-2" data-testid="datatable-actions">{actions}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full" data-testid="datatable-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={`${String(col.key)}-${idx}`}
                  className={col.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span aria-label={sortDir === 'asc' ? 'Sorted ascending' : 'Sorted descending'}>
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-base-content/60">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={onRowClick ? 'cursor-pointer hover' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  data-testid={`datatable-row-${idx}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={`${String(col.key)}-${colIdx}`}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-center mt-4">
          <div className="join" data-testid="datatable-pagination">
            <button
              className="join-item btn btn-sm"
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
            >
              «
            </button>
            <button className="join-item btn btn-sm btn-disabled">
              Page {pagination.currentPage} of {pagination.totalPages}
            </button>
            <button
              className="join-item btn btn-sm"
              disabled={!pagination.hasNext}
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
