import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaEditorModal } from './SchemaEditorModal';

describe('SchemaEditorModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    collectionName: 'test_collection',
    initialFields: [],
    onClose: mockOnClose,
    onSave: mockOnSave,
    mode: 'create' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<SchemaEditorModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Define Fields')).not.toBeInTheDocument();
  });

  it('should render create mode with one empty field', () => {
    render(<SchemaEditorModal {...defaultProps} />);
    
    expect(screen.getByText('Define Fields')).toBeInTheDocument();
    expect(screen.getByTestId('schema-field-name-0')).toBeInTheDocument();
    expect(screen.getByTestId('schema-add-field-btn')).toBeInTheDocument();
  });

  it('should render edit mode with initial fields', () => {
    const initialFields = [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: true },
    ];
    
    render(<SchemaEditorModal {...defaultProps} mode="edit" initialFields={initialFields} />);
    
    expect(screen.getByText('Edit Schema: test_collection')).toBeInTheDocument();
    expect(screen.getByTestId('schema-field-name-0')).toHaveValue('id');
    expect(screen.getByTestId('schema-field-name-1')).toHaveValue('name');
  });

  it('should add a new field when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    await user.click(screen.getByTestId('schema-add-field-btn'));
    
    expect(screen.getByTestId('schema-field-name-1')).toBeInTheDocument();
  });

  it('should remove a field when remove button is clicked', async () => {
    const user = userEvent.setup();
    const initialFields = [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: true },
    ];
    
    render(<SchemaEditorModal {...defaultProps} mode="edit" initialFields={initialFields} />);
    
    await user.click(screen.getByTestId('schema-remove-field-1'));
    
    expect(screen.queryByTestId('schema-field-name-1')).not.toBeInTheDocument();
  });

  it('should validate at least one field is required', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    // Clear the default field name
    await user.clear(screen.getByTestId('schema-field-name-0'));
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('At least one field is required')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate unique field names', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    // Set duplicate field names
    await user.type(screen.getByTestId('schema-field-name-0'), 'field1');
    await user.click(screen.getByTestId('schema-add-field-btn'));
    await user.type(screen.getByTestId('schema-field-name-1'), 'field1');
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Field names must be unique')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with correct changes for create mode', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    
    render(<SchemaEditorModal {...defaultProps} />);
    
    await user.type(screen.getByTestId('schema-field-name-0'), 'id');
    await user.selectOptions(screen.getByTestId('schema-field-type-0'), 'integer');
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        add_columns: [
          { name: 'id', type: 'integer', nullable: false, unique: false },
        ],
      });
    });
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update field type when changed', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    const typeSelect = screen.getByTestId('schema-field-type-0');
    await user.selectOptions(typeSelect, 'boolean');
    
    expect(typeSelect).toHaveValue('boolean');
  });

  it('should update field nullable when checkbox is changed', async () => {
    const user = userEvent.setup();
    render(<SchemaEditorModal {...defaultProps} />);
    
    const nullableCheckbox = screen.getByTestId('schema-field-nullable-0') as HTMLInputElement;
    expect(nullableCheckbox.checked).toBe(false);
    
    await user.click(nullableCheckbox);
    
    expect(nullableCheckbox.checked).toBe(true);
  });

  it('should show error when onSave fails', async () => {
    const user = userEvent.setup();
    mockOnSave.mockRejectedValue(new Error('Network error'));
    
    render(<SchemaEditorModal {...defaultProps} />);
    
    await user.type(screen.getByTestId('schema-field-name-0'), 'id');
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should disable save button while saving', async () => {
    const user = userEvent.setup();
    let resolveOnSave: () => void;
    const onSavePromise = new Promise<void>(resolve => {
      resolveOnSave = resolve;
    });
    mockOnSave.mockReturnValue(onSavePromise);
    
    render(<SchemaEditorModal {...defaultProps} />);
    
    await user.type(screen.getByTestId('schema-field-name-0'), 'id');
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('schema-save-btn')).toBeDisabled();
    });
    
    resolveOnSave!();
  });

  it('should track field changes in edit mode', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    
    const initialFields = [
      { name: 'id', type: 'string', nullable: false },
    ];
    
    render(<SchemaEditorModal {...defaultProps} mode="edit" initialFields={initialFields} />);
    
    // Add a new field
    await user.click(screen.getByTestId('schema-add-field-btn'));
    await user.type(screen.getByTestId('schema-field-name-1'), 'name');
    
    await user.click(screen.getByTestId('schema-save-btn'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        add_columns: [
          { name: 'name', type: 'string', nullable: false, unique: false },
        ],
      });
    });
  });
});
