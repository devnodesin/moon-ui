import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordView } from './RecordView';
import type { FieldDefinition } from './RecordView';

interface TestRecord {
  name: string;
  email: string;
  age: number;
  active: boolean;
  role: string;
  [key: string]: unknown;
}

const testData: TestRecord = {
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  active: true,
  role: 'admin',
};

const fields: FieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'text', editable: true },
  { key: 'email', label: 'Email', type: 'email', editable: true },
  { key: 'age', label: 'Age', type: 'number', editable: true },
  { key: 'active', label: 'Active', type: 'boolean', editable: true },
  { key: 'role', label: 'Role', type: 'select', editable: true, options: ['admin', 'user', 'viewer'] },
];

describe('RecordView', () => {
  it('should render field labels in view mode', () => {
    render(<RecordView data={testData} fields={fields} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('should render field values as plain text in view mode', () => {
    render(<RecordView data={testData} fields={fields} />);

    expect(screen.getByTestId('value-name')).toHaveTextContent('Alice');
    expect(screen.getByTestId('value-email')).toHaveTextContent('alice@example.com');
    expect(screen.getByTestId('value-age')).toHaveTextContent('30');
    expect(screen.getByTestId('value-active')).toHaveTextContent('Yes');
  });

  it('should show Edit button in view mode when onSave is provided', () => {
    const onSave = vi.fn();
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    expect(screen.getByTestId('record-edit')).toBeInTheDocument();
  });

  it('should not show Edit button when onSave is not provided', () => {
    render(<RecordView data={testData} fields={fields} />);

    expect(screen.queryByTestId('record-edit')).not.toBeInTheDocument();
  });

  it('should switch to edit mode when Edit is clicked', () => {
    const onSave = vi.fn();
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('record-edit'));

    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('record-save')).toBeInTheDocument();
    expect(screen.getByTestId('record-cancel')).toBeInTheDocument();
  });

  it('should revert changes and exit edit mode on Cancel', () => {
    const onSave = vi.fn();
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('record-edit'));

    // Change a value
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Bob' } });

    // Cancel
    fireEvent.click(screen.getByTestId('record-cancel'));

    // Should be back in view mode with original data
    expect(screen.getByTestId('value-name')).toHaveTextContent('Alice');
    expect(screen.queryByTestId('input-name')).not.toBeInTheDocument();
  });

  it('should call onSave with draft data and return to view mode', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('record-edit'));
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByTestId('record-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('record-save')).not.toBeInTheDocument();
    });
  });

  it('should call onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(<RecordView data={testData} fields={fields} onBack={onBack} />);

    fireEvent.click(screen.getByTestId('record-back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('should not show Back button when onBack is not provided', () => {
    render(<RecordView data={testData} fields={fields} />);

    expect(screen.queryByTestId('record-back')).not.toBeInTheDocument();
  });

  it('should render select field with options in edit mode', () => {
    const onSave = vi.fn();
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('record-edit'));

    const select = screen.getByTestId('input-role');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('admin');
  });

  it('should render boolean field as toggle in edit mode', () => {
    const onSave = vi.fn();
    render(<RecordView data={testData} fields={fields} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('record-edit'));

    const toggle = screen.getByTestId('input-active');
    expect(toggle).toBeChecked();
  });

  it('should display null values as dash in view mode', () => {
    const nullData = { ...testData, name: null as unknown as string };
    render(<RecordView data={nullData} fields={fields} />);

    expect(screen.getByTestId('value-name')).toHaveTextContent('—');
  });
});
