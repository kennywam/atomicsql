export type DataType = "INT" | "TEXT";

export interface Column {
  name: string;
  type: DataType;
  primaryKey?: boolean;
  unique?: boolean;
}

export type Row = Map<string, any>;

export interface Table {
  name: string;
  columns: Column[];
  rows: Row[];
  indexes: Map<string, Map<any, number[]>>;
}
