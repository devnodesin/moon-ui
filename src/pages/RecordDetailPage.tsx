import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecordView } from '../components/RecordView';
import type { FieldDefinition } from '../components/RecordView';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as collectionService from '../services/collectionService';
import type { CollectionColumn } from '../services/collectionService';

function mapColumnType(type: string): FieldDefinition['type'] {
  const lower = type.toLowerCase();
  if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('number') || lower.includes('decimal')) {
    return 'number';
  }
  if (lower.includes('bool')) return 'boolean';
  if (lower.includes('date') || lower.includes('time')) return 'date';
  if (lower.includes('email')) return 'email';
  return 'text';
}

function buildFieldDefinitions(columns: CollectionColumn[]): FieldDefinition[] {
  return columns.map((col) => ({
    key: col.name,
    label: col.name,
    type: mapColumnType(col.type),
    editable: col.name !== 'id',
  }));
}

export function RecordDetailPage() {
  const { collectionName, id } = useParams<{ collectionName: string; id: string }>();
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';
  const collection = collectionName ?? '';
  const isNew = id === 'new';

  const fetchData = useCallback(async () => {
    if (!baseUrl || !token || !collection) return;
    setLoading(true);
    startLoading();
    try {
      const schema = await collectionService.getSchema(baseUrl, token, collection);
      const fieldDefs = buildFieldDefinitions(schema);
      setFields(fieldDefs);

      if (isNew) {
        // Build empty record from schema
        const empty: Record<string, unknown> = {};
        schema.forEach((col) => { empty[col.name] = ''; });
        setRecord(empty);
      } else {
        const data = await collectionService.getRecord(baseUrl, token, collection, id!);
        setRecord(data);
      }
    } catch {
      notify.error('Failed to load record');
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, collection, id, isNew, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (isNew) {
          await collectionService.createRecord(baseUrl, token, collection, data);
          notify.success('Record created');
          navigate(`/admin/collections/${encodeURIComponent(collection)}`);
        } else {
          await collectionService.updateRecord(baseUrl, token, collection, id!, data);
          notify.success('Record updated');
          await fetchData();
        }
      } catch {
        notify.error('Failed to save record');
        throw new Error('Save failed');
      }
    },
    [baseUrl, token, collection, id, isNew, notify, navigate, fetchData],
  );

  const handleBack = useCallback(() => {
    navigate(`/admin/collections/${encodeURIComponent(collection)}`);
  }, [navigate, collection]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!record) {
    return (
      <div>
        <button className="btn btn-sm btn-ghost mb-4" onClick={handleBack}>
          ← Back
        </button>
        <p className="text-base-content/60">Record not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {isNew ? `New Record in ${collection}` : `${collection} / ${id}`}
      </h1>
      <RecordView<Record<string, unknown>>
        data={record}
        fields={fields}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
}
