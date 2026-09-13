type Row = Record<string, unknown>
type Params = unknown[]

function parseWhere(where: string, params: Params): (row: Row) => boolean {
  const orParts = where.split(/\s+OR\s+/)
  return (row: Row) => orParts.some(part => {
    const andParts = part.split(/\s+AND\s+/)
    return andParts.every(cond => {
      const trimmed = cond.trim()
      const inMatch = trimmed.match(/^(\w+)\s+IN\s*\((.+)\)$/)
      if (inMatch) {
        const [, col, listStr] = inMatch
        const list = listStr.split(',').map(s => {
          const t = s.trim().replace(/^['"]|['"]$/g, '')
          return isNaN(Number(t)) ? t : Number(t)
        })
        return list.includes(row[col] as never)
      }
      const gtMatch = trimmed.match(/^(\w+)\s*>\s*(.+)$/)
      if (gtMatch) {
        const [, col, rawVal] = gtMatch
        const nv = Number(rawVal.trim())
        if (!isNaN(nv)) return (Number(row[col]) || 0) > nv
      }
      const eqMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/)
      if (eqMatch) {
        const [, col, rawVal] = eqMatch
        const val = row[col]
        if (rawVal.trim() === 'NULL') return val === null
        const sv = rawVal.trim().replace(/^['"]|['"]$/g, '')
        const nv = Number(sv)
        const cmp = isNaN(nv) ? sv : nv
        return val === cmp
      }
      return true
    })
  })
}

function parseOrderBy(clause: string): (a: Row, b: Row) => number {
  const parts = clause.split(',').map(p => {
    const [col, dir] = p.trim().split(/\s+/)
    return { col, asc: !dir || dir.toUpperCase() === 'ASC' }
  })
  return (a: Row, b: Row) => {
    for (const { col, asc } of parts) {
      const va = a[col] ?? 0
      const vb = b[col] ?? 0
      const cmp = (va as number) - (vb as number)
      if (cmp !== 0) return asc ? cmp : -cmp
    }
    return 0
  }
}

function resolveExpr(expr: string, row: Row): number {
  const trimmed = expr.trim()

  const caseMatch = trimmed.match(/^CASE\s+WHEN\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+?)\s+END$/i)
  if (caseMatch) {
    const [, condExpr, thenExpr, elseExpr] = caseMatch
    const condParts = condExpr.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/)
    if (condParts) {
      const [, col, val] = condParts
      const conditionMet = row[col] === val || row[col] === Number(val)
      return resolveExpr(conditionMet ? thenExpr : elseExpr, row)
    }
    return resolveExpr(elseExpr, row)
  }

  const colRef = trimmed.replace(/[`"]/g, '')
  const val = row[colRef]
  return typeof val === 'number' ? val : (Number(val) || 0)
}

export class InMemoryDb {
  tables: Record<string, Row[]> = {}
  private autoInc: Record<string, number> = {}

  exec(sql: string): void {
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean)
    for (const stmt of stmts) {
      const createMatch = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]+)\)/i)
      if (createMatch) {
        const [, name] = createMatch
        if (!this.tables[name]) {
          this.tables[name] = []
          this.autoInc[name] = 0
        }
      }
    }
  }

  prepare(sql: string) {
    const trimmed = sql.trim().replace(/\s+/g, ' ')
    const upper = trimmed.toUpperCase()
    if (upper.startsWith('INSERT')) return { run: (...p: Params) => this._insert(trimmed, p) }
    if (upper.startsWith('UPDATE')) return { run: (...p: Params) => this._update(trimmed, p) }
    if (upper.startsWith('DELETE')) return { run: (...p: Params) => this._delete(trimmed, p) }
    if (upper.startsWith('SELECT')) return {
      get: (...p: Params): Row | undefined => this._selectAll(trimmed, p)[0],
      all: (...p: Params): Row[] => this._selectAll(trimmed, p),
    }
    return { run: () => ({}), get: () => undefined, all: () => [] as Row[] }
  }

  transaction<T>(fn: () => T): () => T { return () => fn() }

  private _insert(sql: string, params: Params): { changes: number; lastInsertRowid: number } {
    const m = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES/i)
    if (!m) return { changes: 0, lastInsertRowid: 0 }
    const table = m[1]
    const cols = m[2].split(',').map(c => c.trim())
    const row: Row = {}
    cols.forEach((c, i) => { row[c] = params[i] })
    if (!this.tables[table]) this.tables[table] = []
    if (row.id == null) {
      this.autoInc[table] = (this.autoInc[table] || 0) + 1
      row.id = this.autoInc[table]
    }
    this.tables[table].push(row)
    return { changes: 1, lastInsertRowid: row.id as number }
  }

  private _update(sql: string, params: Params): { changes: number } {
    const setM = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i)
    if (!setM) return { changes: 0 }
    const [, table, setClause, whereClause] = setM
    const setParts = setClause.split(',').map(p => {
      const eqIdx = p.indexOf('=')
      return { col: p.slice(0, eqIdx).trim(), val: p.slice(eqIdx + 1).trim() }
    })
    let pi = 0
    const vals = setParts.map(p => {
      if (p.val === 'unixepoch()') return Math.floor(Date.now() / 1000)
      if (p.val === '?') return params[pi++]
      const v = p.val.replace(/^['"]|['"]$/g, '')
      return isNaN(Number(v)) ? v : Number(v)
    })
    if (!this.tables[table]) return { changes: 0 }
    const whereFn = whereClause ? parseWhere(whereClause, params.slice(pi)) : null
    let count = 0
    for (const row of this.tables[table]) {
      if (whereFn && !whereFn(row)) continue
      setParts.forEach((p, i) => { row[p.col] = vals[i] })
      count++
    }
    return { changes: count }
  }

  private _delete(sql: string, params: Params): { changes: number } {
    const m = sql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i)
    if (!m) return { changes: 0 }
    const [, table, whereClause] = m
    if (!this.tables[table]) return { changes: 0 }
    if (!whereClause) {
      const n = this.tables[table].length
      this.tables[table] = []
      return { changes: n }
    }
    const whereFn = parseWhere(whereClause, params)
    const before = this.tables[table].length
    this.tables[table] = this.tables[table].filter(r => !whereFn(r))
    return { changes: before - this.tables[table].length }
  }

  private _selectAll(sql: string, params: Params): Row[] {
    const upper = sql.toUpperCase().replace(/\s+/g, ' ').trim()
    if (upper.includes('JOIN')) return this._selectJoin(sql, params)
    if (/\b(SUM|COUNT|AVG)\s*\(/i.test(upper)) return this._selectAggregate(sql, params)

    const fromM = sql.match(/FROM\s+(\w+)/i)
    if (!fromM) return []
    const table = fromM[1]
    if (!this.tables[table]) return []

    let rows = [...this.tables[table]]
    const whereM = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
    if (whereM) rows = rows.filter(parseWhere(whereM[1], params))

    const orderM = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i)
    if (orderM) rows.sort(parseOrderBy(orderM[1]))

    const limitM = sql.match(/LIMIT\s+(\d+)/i)
    if (limitM) rows = rows.slice(0, Number(limitM[1]))

    const selM = sql.match(/SELECT\s+(.+?)\s+FROM/i)
    if (selM && selM[1].trim() !== '*') {
      const cols = selM[1].split(',').map(c => c.trim())
      return rows.map(r => {
        const out: Row = {}
        for (const c of cols) {
          const am = c.match(/(.+?)\s+AS\s+(\w+)/i)
          if (am) out[am[2]] = r[am[1].trim()]
          else out[c] = r[c]
        }
        return out
      })
    }
    return rows
  }

  private _selectAggregate(sql: string, params: Params): Row[] {
    const fromM = sql.match(/FROM\s+(\w+)/i)
    if (!fromM) return []
    const table = fromM[1]
    if (!this.tables[table]) return [{ count: 0 }]

    let rows = [...this.tables[table]]
    const whereM = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i)
    if (whereM) rows = rows.filter(parseWhere(whereM[1], params))

    const result: Row = {}
    const selectM = sql.match(/SELECT\s+(.+?)\s+FROM/i)
    if (!selectM) return [result]

    const selectBody = selectM[1]
    const exprs = selectBody.split(',').map(e => e.trim())

    for (const expr of exprs) {
      const sumCaseM = expr.match(/SUM\(\s*(CASE\s+WHEN\s+.+?END)\s*\)\s*(?:AS\s+(\w+))?/i)
      if (sumCaseM) {
        const [, caseExpr, alias] = sumCaseM
        result[alias || 'sum'] = rows.reduce((s, r) => s + resolveExpr(caseExpr, r), 0)
        continue
      }

      const sumM = expr.match(/SUM\(\s*(\w+(?:\.\w+)?)\s*\)\s*(?:AS\s+(\w+))?/i)
      if (sumM) {
        const [, col, alias] = sumM
        const colName = col.includes('.') ? col.split('.')[1] : col
        result[alias || colName] = rows.reduce((s, r) => s + (Number(r[colName]) || 0), 0)
        continue
      }

      const coalesceSumM = expr.match(/COALESCE\(\s*SUM\(\s*(\w+(?:\.\w+)?)\s*\)\s*,\s*(\d+)\s*\)\s*(?:AS\s+(\w+))?/i)
      if (coalesceSumM) {
        const [, col, defVal, alias] = coalesceSumM
        const colName = col.includes('.') ? col.split('.')[1] : col
        const sum = rows.reduce((s, r) => s + (Number(r[colName]) || 0), 0)
        result[alias || colName] = sum || Number(defVal)
        continue
      }

      const coalesceAvgM = expr.match(/COALESCE\(\s*AVG\(\s*(\w+(?:\.\w+)?)\s*\)\s*,\s*(\d+)\s*\)\s*(?:AS\s+(\w+))?/i)
      if (coalesceAvgM) {
        const [, col, defVal, alias] = coalesceAvgM
        const colName = col.includes('.') ? col.split('.')[1] : col
        const avg = rows.length > 0
          ? rows.reduce((s, r) => s + (Number(r[colName]) || 0), 0) / rows.length
          : Number(defVal)
        result[alias || 'avg'] = avg
        continue
      }

      const countM = expr.match(/COUNT\(\s*\*?\s*\)\s*(?:AS\s+(\w+))?/i)
      if (countM) {
        result[countM[1] || 'count'] = rows.length
        continue
      }

      const simpleColM = expr.match(/^(\w+)$/)
      if (simpleColM) {
        result[simpleColM[1]] = rows.length
        continue
      }
    }

    return [result]
  }

  private _selectJoin(sql: string, params: Params): Row[] {
    const fromM = sql.match(/FROM\s+(\w+)\s+(?:\w+\s+)?(?:AS\s+\w+\s+)?(?:JOIN|\s|$)/i)
    const joinM = sql.match(/JOIN\s+(\w+)\s+(?:\w+\s+)?(?:AS\s+\w+\s+)?ON\s+(.+?)(?:\s+WHERE|\s+ORDER|\s+LIMIT|$)/i)
    if (!fromM || !joinM) return []

    const leftTable = fromM[1]
    const rightTable = joinM[1]
    const onClause = joinM[2]

    const leftRows = this.tables[leftTable] || []
    const rightRows = this.tables[rightTable] || []

    const onParts = onClause.split('=').map(s => {
      const parts = s.trim().split('.')
      return parts.length > 1 ? { table: parts[0], col: parts[1] } : { table: '', col: parts[0] }
    })

    let joined: Row[] = []
    for (const l of leftRows) {
      for (const r of rightRows) {
        const match = onParts.every(p => {
          const lv = p.table ? l[p.col] : l[p.col]
          const rv = p.table ? r[p.col] : r[p.col]
          return lv === rv
        })
        if (match) joined.push({ ...l, ...r })
      }
    }

    const whereM = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
    if (whereM) joined = joined.filter(parseWhere(whereM[1], params))

    const orderM = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i)
    if (orderM) joined.sort(parseOrderBy(orderM[1]))

    const limitM = sql.match(/LIMIT\s+(\d+)/i)
    if (limitM) joined = joined.slice(0, Number(limitM[1]))

    return joined
  }
}
