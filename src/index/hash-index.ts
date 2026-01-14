export class HashIndex {
  private index: Map<any, number[]> = new Map()

  get(value: any): number[] | undefined {
    return this.index.get(value)
  }

  set(value: any, rowIds: number[]): void {
    this.index.set(value, rowIds)
  }

  add(value: any, rowId: number): void {
    if (!this.index.has(value)) {
      this.index.set(value, [])
    }
    this.index.get(value)!.push(rowId)
  }

  remove(value: any, rowId: number): void {
    const rowIds = this.index.get(value)
    if (rowIds) {
      const newRowIds = rowIds.filter((id) => id !== rowId)
      if (newRowIds.length === 0) {
        this.index.delete(value)
      } else {
        this.index.set(value, newRowIds)
      }
    }
  }

  clear(): void {
    this.index.clear()
  }

  has(value: any): boolean {
    return this.index.has(value)
  }

  rebuild(rows: Map<string, any>[], columnName: string): void {
    this.index.clear()
    rows.forEach((row, rowId) => {
      const value = row.get(columnName)
      if (!this.index.has(value)) {
        this.index.set(value, [])
      }
      this.index.get(value)!.push(rowId)
    })
  }

  size(): number {
    return this.index.size
  }

  keys(): any[] {
    return Array.from(this.index.keys())
  }

  values(): number[][] {
    return Array.from(this.index.values())
  }

  entries(): [any, number[]][] {
    return Array.from(this.index.entries())
  }
}
