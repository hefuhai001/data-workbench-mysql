// 获取指定表的元数据：查询 information_schema.columns 返回列列表（名称/类型/键/可空/默认值）
// 及主键列名数组，用于数据网格渲染、主键列定位与新增/编辑表单生成。connectionId 可选。
export default defineEventHandler(async (event) => {
  const query = getQuery<{ database?: string; table?: string; connectionId?: string }>(event)
  const { database, table } = query
  const connectionId = query.connectionId || undefined
  if (!database || !table) throw createError({ statusCode: 400, statusMessage: '缺 database/table' })
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      const [cols] = await conn.query(
        `SELECT column_name AS columnName, column_type AS columnType, data_type AS dataType,
                column_key AS columnKey, is_nullable AS isNullable, column_default AS columnDefault, extra
         FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`,
        [database, table]
      )
      const [indexes] = await conn.query(`SHOW INDEX FROM \`${esc(table)}\``)
      const [foreignKeys] = await conn.query(
        `SELECT kcu.column_name AS columnName, kcu.referenced_table_name AS refTable,
                kcu.referenced_column_name AS refColumn, kcu.constraint_name AS constraintName
         FROM information_schema.key_column_usage kcu
         WHERE kcu.table_schema = ? AND kcu.table_name = ? AND kcu.referenced_table_name IS NOT NULL
         ORDER BY kcu.ordinal_position`,
        [database, table]
      )
      const [ddlRows] = await conn.query(`SHOW CREATE TABLE \`${esc(table)}\``)
      const ddlRow = (ddlRows as any)[0]
      const primaryKey = (cols as any[]).filter(c => c.columnKey === 'PRI').map(c => c.columnName)
      return {
        columns: cols,
        primaryKey,
        indexes,
        foreignKeys,
        ddl: ddlRow ? (ddlRow as any)['Create Table'] || '' : ''
      }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? (e?.errno !== undefined ? 400 : 500), statusMessage: e?.sqlMessage || e?.message || String(e) })
  }
})