import Database from "better-sqlite3";
import { readFileSync, readdirSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, "migrations");

export function initDatabase(dbPath: string): Database.Database {
  // 自动创建目录（非内存数据库时）
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);

  // 确保 migrations 表存在
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    (
      db.prepare("SELECT name FROM migrations").all() as {
        name: string;
      }[]
    ).map((r) => r.name)
  );

  // 读取目录下的 .sql 文件，按文件名排序
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO migrations (name, applied_at) VALUES (?, ?)").run(
      file,
      new Date().toISOString()
    );
  }

  return db;
}

export interface BackendService {
  id: string;
  name: string;
  api_type: "openai" | "anthropic";
  base_url: string;
  api_key: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ModelMapping {
  id: string;
  client_model: string;
  backend_model: string;
  backend_service_id: string;
  is_active: number;
  created_at: string;
}

export function getActiveBackendServices(
  db: Database.Database,
  apiType: "openai" | "anthropic"
): BackendService[] {
  return db
    .prepare(
      "SELECT * FROM backend_services WHERE api_type = ? AND is_active = 1"
    )
    .all(apiType) as BackendService[];
}

export function getModelMapping(
  db: Database.Database,
  clientModel: string
): ModelMapping | undefined {
  return db
    .prepare(
      "SELECT * FROM model_mappings WHERE client_model = ? AND is_active = 1"
    )
    .get(clientModel) as ModelMapping | undefined;
}

export function insertRequestLog(
  db: Database.Database,
  log: {
    id: string;
    api_type: string;
    model: string | null;
    backend_service_id: string | null;
    status_code: number | null;
    latency_ms: number | null;
    is_stream: number;
    error_message: string | null;
    created_at: string;
  }
): void {
  db.prepare(
    `INSERT INTO request_logs (id, api_type, model, backend_service_id, status_code, latency_ms, is_stream, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    log.id,
    log.api_type,
    log.model,
    log.backend_service_id,
    log.status_code,
    log.latency_ms,
    log.is_stream,
    log.error_message,
    log.created_at
  );
}
