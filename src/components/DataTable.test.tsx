import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './DataTable';
import type { Column, Pagination } from './DataTable';

interface TestRow {
  id: number;
  name: string;
  email: string;
}

const columns: Column<TestRow>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
];

const data: TestRow[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

describe('DataTable', () => {
  it('should render column headers', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render data rows', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should show "No data available" when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should call onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByTestId('datatable-row-0'));

    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('should call onSearch when search input changes', () => {
    const onSearch = vi.fn();
    render(<DataTable columns={columns} data={data} onSearch={onSearch} />);

    fireEvent.change(screen.getByTestId('datatable-search'), { target: { value: 'Alice' } });

    expect(onSearch).toHaveBeenCalledWith('Alice');
  });

  it('should not render search input when onSearch is not provided', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.queryByTestId('datatable-search')).not.toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        actions={<button>Export</button>}
      />
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should sort data when a sortable header is clicked', () => {
    render(<DataTable columns={columns} data={data} />);

    // Click Name header to sort ascending
    fireEvent.click(screen.getByText('Name'));

    const rows = screen.getAllByTestId(/datatable-row-/);
    expect(rows[0]).toHaveTextContent('Alice');
    expect(rows[2]).toHaveTextContent('Charlie');

    // Click again to sort descending
    fireEvent.click(screen.getByText('Name'));

    const rows2 = screen.getAllByTestId(/datatable-row-/);
    expect(rows2[0]).toHaveTextContent('Charlie');
    expect(rows2[2]).toHaveTextContent('Alice');
  });

  it('should render pagination controls', () => {
    const pagination: Pagination = {
      currentPage: 1,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    };

    render(<DataTable columns={columns} data={data} pagination={pagination} />);

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should call onPageChange when pagination buttons are clicked', () => {
    const onPageChange = vi.fn();
    const pagination: Pagination = {
      currentPage: 2,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    };

    render(
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('»'));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByText('«'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable prev button on first page', () => {
    const pagination: Pagination = {
      currentPage: 1,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    };

    render(<DataTable columns={columns} data={data} pagination={pagination} />);

    expect(screen.getByText('«')).toBeDisabled();
    expect(screen.getByText('»')).not.toBeDisabled();
  });

  it('should show loading spinner when isLoading', () => {
    render(<DataTable columns={columns} data={[]} isLoading={true} />);

    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should support custom render function for columns', () => {
    const columnsWithRender: Column<TestRow>[] = [
      {
        key: 'name',
        label: 'Name',
        render: (_value, row) => <strong>{row.name.toUpperCase()}</strong>,
      },
    ];

    render(<DataTable columns={columnsWithRender} data={data} />);

    expect(screen.getByText('ALICE')).toBeInTheDocument();
  });

  it('should render Action column when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={data} onDelete={onDelete} />);

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should render delete buttons for each row when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={data} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTestId(/delete-btn-/);
    expect(deleteButtons).toHaveLength(3);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={data} onDelete={onDelete} />);

    const deleteButton = screen.getByTestId('delete-btn-0');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(data[0]);
  });

  it('should not call onRowClick when delete button is clicked', () => {
    const onDelete = vi.fn();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onDelete={onDelete} onRowClick={onRowClick} />);

    const deleteButton = screen.getByTestId('delete-btn-0');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(data[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('should not render Action column when onDelete is not provided', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.queryByText('Action')).not.toBeInTheDocument();
  });
});
