import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage: string;
}

/** Tabela com cabeçalho e mensagem de lista vazia (modelo de classes do frontend web v02, secção 8.1). */
export function DataTable<T>({ columns, rows, rowKey, emptyMessage }: Readonly<DataTableProps<T>>) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td key={column.key}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
