import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'autocorp.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeSchema(db)
    seedData(db)
  }
  return db
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      current_task TEXT,
      confidence REAL DEFAULT 0,
      last_decision TEXT,
      health REAL DEFAULT 100,
      queue_size INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 1.0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS agent_messages (
      id TEXT PRIMARY KEY,
      from_agent TEXT NOT NULL,
      to_agent TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER DEFAULT (unixepoch()),
      confidence REAL DEFAULT 0,
      metadata TEXT,
      FOREIGN KEY (from_agent) REFERENCES agents(id),
      FOREIGN KEY (to_agent) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp INTEGER DEFAULT (unixepoch()),
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      decision TEXT NOT NULL,
      confidence REAL DEFAULT 0,
      duration INTEGER DEFAULT 0,
      cost_estimate REAL DEFAULT 0,
      result TEXT NOT NULL DEFAULT 'pending',
      details TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      risk TEXT NOT NULL DEFAULT 'medium',
      amount REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER DEFAULT (unixepoch()),
      resolved_at INTEGER,
      resolved_by TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      priority TEXT NOT NULL DEFAULT 'medium',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      shipping_status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      reorder_point INTEGER NOT NULL DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      lifetime_value REAL DEFAULT 0,
      segment TEXT NOT NULL DEFAULT 'bronze'
    );

    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER DEFAULT (unixepoch()),
      revenue REAL DEFAULT 0,
      orders_count INTEGER DEFAULT 0,
      profit REAL DEFAULT 0,
      active_agents INTEGER DEFAULT 0,
      pending_approvals INTEGER DEFAULT 0,
      alerts INTEGER DEFAULT 0,
      health_score REAL DEFAULT 100
    );
  `)
}

function seedData(db: Database.Database): void {
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }
  if (agentCount.count > 0) return

  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, role, status, current_task, confidence, last_decision, health, queue_size, tasks_completed, success_rate)
    VALUES (?, ?, ?, 'idle', NULL, ?, NULL, 100, 0, 0, 1.0)
  `)

  const agents = [
    ['sales-agent', 'Alex Sales', 'sales', 0.92],
    ['finance-agent', 'Fiona Finance', 'finance', 0.95],
    ['inventory-agent', 'Ivan Inventory', 'inventory', 0.89],
    ['shipping-agent', 'Sarah Shipping', 'shipping', 0.91],
    ['marketing-agent', 'Maya Marketing', 'marketing', 0.88],
    ['support-agent', 'Sam Support', 'support', 0.93],
    ['executive-agent', 'Eve Executive', 'executive', 0.97],
  ]

  const insertMany = db.transaction(() => {
    for (const [id, name, role, confidence] of agents) {
      insertAgent.run(id, name, role, confidence)
    }
  })
  insertMany()

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, sku, price, cost, stock, category, reorder_point)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const products = [
    ['prod-1', 'Quantum Widget', 'QWT-001', 49.99, 22.50, 150, 'widgets', 25],
    ['prod-2', 'Nano Gadget', 'NGD-002', 89.99, 41.00, 85, 'gadgets', 15],
    ['prod-3', 'Fusion Device', 'FDV-003', 199.99, 95.00, 42, 'devices', 10],
    ['prod-4', 'Plasma Core', 'PLC-004', 349.99, 170.00, 18, 'cores', 5],
    ['prod-5', 'Digital Lens', 'DLN-005', 29.99, 12.00, 300, 'accessories', 50],
    ['prod-6', 'Neural Interface', 'NIF-006', 599.99, 280.00, 7, 'devices', 3],
    ['prod-7', 'Eco Sensor', 'ECS-007', 79.99, 35.00, 63, 'sensors', 20],
    ['prod-8', 'Hyper Connector', 'HCN-008', 149.99, 70.00, 28, 'accessories', 10],
  ]

  for (const p of products) {
    insertProduct.run(...p)
  }

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, total_orders, total_spent, lifetime_value, segment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const customers = [
    ['cust-1', 'Acme Corp', 'acme@example.com', 12, 45000, 52000, 'platinum'],
    ['cust-2', 'Globex Inc', 'globex@example.com', 8, 18500, 22000, 'gold'],
    ['cust-3', 'Initech', 'initech@example.com', 5, 8900, 10500, 'silver'],
    ['cust-4', 'Umbrella Co', 'umbrella@example.com', 3, 4200, 5000, 'silver'],
    ['cust-5', 'Stark Industries', 'stark@example.com', 20, 120000, 145000, 'platinum'],
    ['cust-6', 'Wayne Enterprises', 'wayne@example.com', 15, 78000, 92000, 'platinum'],
    ['cust-7', 'Oscorp', 'oscorp@example.com', 2, 1500, 1800, 'bronze'],
    ['cust-8', 'Cyberdyne Systems', 'cyberdyne@example.com', 1, 600, 600, 'bronze'],
  ]

  for (const c of customers) {
    insertCustomer.run(...c)
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, total, status, priority, payment_status, shipping_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?)
  `)

  const now = Math.floor(Date.now() / 1000)
  const orders = [
    ['ord-1', 'cust-1', 'Acme Corp', 149.97, 'completed', 'high', 'approved', 'delivered', now - 86400 * 7, now - 86400 * 5],
    ['ord-2', 'cust-2', 'Globex Inc', 549.97, 'completed', 'medium', 'approved', 'delivered', now - 86400 * 5, now - 86400 * 3],
    ['ord-3', 'cust-3', 'Initech', 199.99, 'shipping', 'low', 'approved', 'shipped', now - 86400 * 2, now - 86400],
    ['ord-4', 'cust-4', 'Umbrella Co', 399.98, 'payment_pending', 'medium', 'pending', 'pending', now - 3600, now - 3600],
    ['ord-5', 'cust-5', 'Stark Industries', 1199.98, 'shipped', 'high', 'approved', 'shipped', now - 86400, now - 43200],
    ['ord-6', 'cust-6', 'Wayne Enterprises', 749.97, 'new', 'high', 'pending', 'pending', now - 1800, now - 1800],
    ['ord-7', 'cust-1', 'Acme Corp', 89.99, 'inventory_check', 'low', 'pending', 'pending', now - 600, now - 600],
    ['ord-8', 'cust-7', 'Oscorp', 149.99, 'new', 'medium', 'pending', 'pending', now - 300, now - 300],
  ]

  const orderItems = [
    ['ord-1', 'prod-1', 'Quantum Widget', 3, 49.99],
    ['ord-2', 'prod-2', 'Nano Gadget', 2, 89.99],
    ['ord-2', 'prod-6', 'Neural Interface', 1, 599.99],
    ['ord-3', 'prod-3', 'Fusion Device', 1, 199.99],
    ['ord-4', 'prod-1', 'Quantum Widget', 2, 49.99],
    ['ord-4', 'prod-5', 'Digital Lens', 10, 29.99],
    ['ord-5', 'prod-6', 'Neural Interface', 2, 599.99],
    ['ord-6', 'prod-3', 'Fusion Device', 1, 199.99],
    ['ord-6', 'prod-4', 'Plasma Core', 1, 349.99],
    ['ord-6', 'prod-8', 'Hyper Connector', 1, 149.99],
    ['ord-7', 'prod-2', 'Nano Gadget', 1, 89.99],
    ['ord-8', 'prod-3', 'Fusion Device', 1, 149.99],
  ]

  const seedOrders = db.transaction(() => {
    for (let i = 0; i < orders.length; i++) {
      insertOrder.run(...orders[i])
    }
    for (const item of orderItems) {
      insertOrderItem.run(...item)
    }
  })
  seedOrders()
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
