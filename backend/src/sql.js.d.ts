declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void
    exec(sql: string, params?: any[]): QueryExecResult[]
    export(): Uint8Array
    getRowsModified(): number
    close(): void
  }

  export interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>
}
