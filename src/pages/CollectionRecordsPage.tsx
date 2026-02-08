import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column, Pagination } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as collectionService from '../services/collectionService';
import type { CollectionColumn } from '../services/collectionService';

const PAGE_SIZE = 20;

export function CollectionRecordsPage() {
  const { collectionName } = useParams<{ collectionName: string }>();
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();

  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [schema, setSchema] = useState<CollectionColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Use ref to avoid including cursors in fetchData dependencies
  const cursorsRef = useRef<string[]>([]);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';
  const collection = collectionName ?? '';

  const fetchData = useCallback(async () => {
    if (!baseUrl || !token || !collection) return;
    setLoading(true);
    startLoading();
    try {
      const [schemaResult, recordsResult] = await Promise.all([
        collectionService.getSchema(baseUrl, token, collection),
        collectionService.listRecords(baseUrl, token, collection, {
          q: search || undefined,
          limit: PAGE_SIZE,
          after: page > 1 ? cursorsRef.current[page - 2] : undefined,
        }),
      ]);
      setSchema(schemaResult);
      setRecords(recordsResult.data ?? []);
      setHasMore(recordsResult.has_more ?? false);
      if (recordsResult.next_cursor && page > cursorsRef.current.length) {
        cursorsRef.current = [...cursorsRef.current, recordsResult.next_cursor];
      }
    } catch {
      notify.error('Failed to load records');
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, collection, search, page, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
    cursorsRef.current = [];
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const columns: Column<Record<string, unknown>>[] = schema.map((col) => ({
    key: col.name as keyof Record<string, unknown>,
    label: col.name,
    sortable: true,
  }));

  // If no schema yet, derive columns from first record
  const derivedColumns: Column<Record<string, unknown>>[] =
    columns.length > 0
      ? columns
      : records.length > 0
        ? Object.keys(records[0]).map((key) => ({
            key: key as keyof Record<string, unknown>,
            label: key,
            sortable: true,
          }))
        : [];

  const pagination: Pagination = {
    currentPage: page,
    totalPages: hasMore ? page + 1 : page,
    hasNext: hasMore,
    hasPrev: page > 1,
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const keys = Object.keys(records[0]);
    const csvRows = [
      keys.join(','),
      ...records.map((row) =>
        keys.map((k) => {
          const val = row[k];
          const str = val == null ? '' : String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','),
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        let importedRecords: Record<string, unknown>[];

        if (file.name.endsWith('.json')) {
          importedRecords = JSON.parse(text);
          if (!Array.isArray(importedRecords)) {
            importedRecords = [importedRecords];
          }
        } else {
          // CSV parsing with quoted field support
          const lines = text.trim().split('\n');
          const parseCsvLine = (line: string): string[] => {
            const fields: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
                else if (ch === '"') { inQuotes = false; }
                else { current += ch; }
              } else {
                if (ch === '"') { inQuotes = true; }
                else if (ch === ',') { fields.push(current.trim()); current = ''; }
                else { current += ch; }
              }
            }
            fields.push(current.trim());
            return fields;
          };
          const headers = parseCsvLine(lines[0]);
          importedRecords = lines.slice(1).filter((l) => l.trim()).map((line) => {
            const values = parseCsvLine(line);
            const record: Record<string, unknown> = {};
            headers.forEach((h, i) => { record[h] = values[i] ?? ''; });
            return record;
          });
        }

        let created = 0;
        for (const record of importedRecords) {
          await collectionService.createRecord(baseUrl, token, collection, record);
          created++;
        }
        notify.success(`Imported ${created} records`);
        fetchData();
      } catch {
        notify.error('Import failed');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = useCallback(async (row: Record<string, unknown>) => {
    const id = String(row.id ?? '');
    if (!id) {
      notify.error('Record ID not found');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await collectionService.deleteRecord(baseUrl, token, collection, id);
      notify.success('Record deleted successfully');
      fetchData();
    } catch {
      notify.error('Failed to delete record');
    }
  }, [baseUrl, token, collection, notify, fetchData]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/admin/collections')}>
          ← Collections
        </button>
        <h1 className="text-2xl font-bold">{collection}</h1>
      </div>

      <DataTable<Record<string, unknown>>
        columns={derivedColumns}
        data={records}
        isLoading={loading}
        pagination={pagination}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onRowClick={(row) => {
          const id = String(row.id ?? '');
          if (id) navigate(`/admin/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
        }}
        onDelete={handleDelete}
        actions={
          <>
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                navigate(`/admin/collections/${encodeURIComponent(collection)}/new`)
              }
              data-testid="create-record-btn"
            >
              + New Record
            </button>
            <button className="btn btn-sm btn-outline" onClick={handleExportJSON} data-testid="export-json-btn">
              Export JSON
            </button>
            <button className="btn btn-sm btn-outline" onClick={handleExportCSV} data-testid="export-csv-btn">
              Export CSV
            </button>
            <label className="btn btn-sm btn-outline" data-testid="import-btn">
              Import
              <input type="file" accept=".json,.csv" className="hidden" onChange={handleImport} />
            </label>
          </>
        }
      />
    </div>
  );
}
