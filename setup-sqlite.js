const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Caminho para o banco de dados
const dbPath = './cosmetic_store.db';

// Remover banco de dados existente se houver
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Banco de dados existente removido');
}

// Criar novo banco de dados
const db = new Database(dbPath);
console.log('Novo banco de dados criado');

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price REAL NOT NULL,
    compare_at_price REAL,
    sku TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER NOT NULL,
    images TEXT,
    ingredients TEXT,
    how_to_use TEXT,
    visible INTEGER NOT NULL DEFAULT 1,
    featured INTEGER DEFAULT 0,
    new_arrival INTEGER DEFAULT 0,
    best_seller INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT NOT NULL,
    shipping_method TEXT,
    shipping_cost REAL,
    payment_method TEXT,
    payment_id TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

console.log('Tabelas criadas com sucesso');

// Criar usuários
const hashedPassword = bcrypt.hashSync('123456', 10);

// Inserir usuário admin
const adminStmt = db.prepare(`
  INSERT INTO users (username, password, email, full_name, role, address, city, state, postal_code, country, phone)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

adminStmt.run(
  'admin',
  hashedPassword,
  'admin@beautyessence.com',
  'Administrador',
  'admin',
  'Av Paulista, 1000',
  'São Paulo',
  'SP',
  '01310-100',
  'Brasil',
  '11987654321'
);

console.log('Usuário admin criado');

// Inserir usuário teste
const testStmt = db.prepare(`
  INSERT INTO users (username, password, email, full_name, role, address, city, state, postal_code, country, phone)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

testStmt.run(
  'teste',
  hashedPassword,
  'teste@exemplo.com',
  'Usuário Teste',
  'customer',
  'Rua Exemplo, 123',
  'Rio de Janeiro',
  'RJ',
  '22222-222',
  'Brasil',
  '21987654321'
);

console.log('Usuário teste criado');

// Inserir categorias
const categories = [
  {
    name: "Skincare",
    slug: "skincare",
    description: "Produtos para cuidados com a pele",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
  },
  {
    name: "Maquiagem",
    slug: "maquiagem",
    description: "Produtos de maquiagem para todos os tipos de pele",
    imageUrl: "https://images.unsplash.com/photo-1596704017248-eb02655de3e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
  },
  {
    name: "Cabelos",
    slug: "cabelos",
    description: "Produtos para cuidados com os cabelos",
    imageUrl: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
  },
  {
    name: "Corpo & Banho",
    slug: "corpo-banho",
    description: "Produtos para cuidados com o corpo",
    imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80"
  },
  {
    name: "Fragrâncias",
    slug: "fragrancias",
    description: "Perfumes e fragrâncias para todos os gostos",
    imageUrl: "https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
  }
];

const categoryStmt = db.prepare(`
  INSERT INTO categories (name, slug, description, image_url)
  VALUES (?, ?, ?, ?)
`);

categories.forEach(category => {
  categoryStmt.run(category.name, category.slug, category.description, category.imageUrl);
});

console.log('Categorias criadas');

// Fechar conexão com o banco de dados
db.close();

console.log('Banco de dados configurado com sucesso!');
