import { DICTIONARY } from "./generics.interface";

export interface SchemaField {
  primary: boolean;
  type: 'string' | 'date' | 'number';
  nullable: boolean;
  reference_to: string;
  filterable: boolean;
  filter_by_range: boolean;
  filter_by_select: boolean;
  is_array: boolean;
}

export interface ConfigSchema {
  name: string;
  base_route: string;
  schema: DICTIONARY<SchemaField>
}