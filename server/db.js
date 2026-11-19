// db.js — Kho dữ liệu bền dạng "tài liệu" (bộ sưu tập → id → JSON), giữ toàn bộ trong RAM, ghi xuống đĩa/DB khi đổi.
// • Có DATABASE_URL (Postgres: Render, Neon, Supabase, Railway…) → bảng docs trong Postgres (thư viện pg, MIT).
// • Không có → SQLite file (node:sqlite có sẵn trong Node ≥ 22) ở DATA_DIR/rubik.db (mặc định ./data). Railway/Fly: gắn volume vào DATA_DIR.
// Quy mô 1 trường (vài nghìn học sinh) vừa RAM; đọc đồng bộ từ Map, ghi gom lô mỗi 1 s.
const path = require('path');
const fs = require('fs');

async function openStore() {
  const cols = new Map(), dirty = new Map();   // col -> Map(id -> obj) · "col\u0000id" -> true (cần ghi) / null (cần xoá)
  let backend;
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const ssl = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) || process.env.PGSSL === '0' ? false : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 4 });
    await pool.query('CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY (col, id))');
    const { rows } = await pool.query('SELECT col, id, v FROM docs');
    backend = {
      name: 'postgres', rows,
      async write(ops) {
        const c = await pool.connect();
        try { await c.query('BEGIN'); for (const [col, id, v] of ops) v == null ? await c.query('DELETE FROM docs WHERE col=$1 AND id=$2', [col, id]) : await c.query('INSERT INTO docs (col,id,v) VALUES ($1,$2,$3) ON CONFLICT (col,id) DO UPDATE SET v=EXCLUDED.v', [col, id, v]); await c.query('COMMIT'); }
        catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
      },
    };
  } else {
    const { DatabaseSync } = require('node:sqlite');
    const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data'); fs.mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(path.join(dir, 'rubik.db'));
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY (col, id))');
    const up = db.prepare('INSERT INTO docs (col,id,v) VALUES (?,?,?) ON CONFLICT (col,id) DO UPDATE SET v=excluded.v'), del = db.prepare('DELETE FROM docs WHERE col=? AND id=?');
    backend = {
      name: 'sqlite:' + path.join(dir, 'rubik.db'), rows: db.prepare('SELECT col, id, v FROM docs').all(),
      async write(ops) { db.exec('BEGIN'); try { for (const [col, id, v] of ops) v == null ? del.run(col, id) : up.run(col, id, v); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } },
    };
  }
  for (const r of backend.rows) { if (!cols.has(r.col)) cols.set(r.col, new Map()); try { cols.get(r.col).set(r.id, JSON.parse(r.v)); } catch (e) {} }
  delete backend.rows;
  const col = c => { if (!cols.has(c)) cols.set(c, new Map()); return cols.get(c); };
  let busy = false;
  async function flush() {
    if (busy || !dirty.size) return; busy = true;
    const ops = [...dirty].map(([k, keep]) => { const [c, id] = k.split('\u0000'), o = keep ? col(c).get(id) : null; return [c, id, o == null ? null : JSON.stringify(o)]; });
    dirty.clear();
    try { await backend.write(ops); } catch (e) { console.error('[db] ghi lỗi, thử lại sau:', e.message); for (const [c, id, v] of ops) dirty.set(c + '\u0000' + id, v != null); }
    busy = false;
  }
  const timer = setInterval(flush, 1000); timer.unref && timer.unref();
  const store = {
    backend: backend.name,
    get: (c, id) => col(c).get(String(id)) || null,
    all: c => [...col(c).values()],
    put: (c, id, o) => { col(c).set(String(id), o); dirty.set(c + '\u0000' + id, true); return o; },
    touch: (c, id) => dirty.set(c + '\u0000' + id, true),   // đã sửa object tại chỗ → đánh dấu ghi
    del: (c, id) => { col(c).delete(String(id)); dirty.set(c + '\u0000' + id, false); },
    flush,
  };
  const bye = async () => { clearInterval(timer); await flush(); process.exit(0); };
  process.once('SIGTERM', bye); process.once('SIGINT', bye);
  return store;
}
module.exports = { openStore };
