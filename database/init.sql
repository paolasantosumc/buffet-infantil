CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('client','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price_per_guest NUMERIC(10,2) NOT NULL,
  min_guests INTEGER NOT NULL DEFAULT 30,
  features JSONB NOT NULL DEFAULT '[]',
  highlighted BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(20) NOT NULL,
  guest_count INTEGER NOT NULL,
  package_id INTEGER REFERENCES packages(id),
  event_address TEXT NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','contacted','confirmed','cancelled')),
  estimated_total NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bookings_event_date_idx ON bookings(event_date);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);

INSERT INTO packages (name, description, price_per_guest, min_guests, features, highlighted)
SELECT 'Festa Alegria', 'O essencial para uma comemoração cheia de sabor e diversão.',
  89.90, 30, '["Cardápio infantil e adulto","Salgadinhos variados","Docinhos tradicionais","Equipe de atendimento"]'::jsonb, false
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Festa Alegria');
INSERT INTO packages (name, description, price_per_guest, min_guests, features, highlighted)
SELECT 'Festa Encanto', 'Mais opções e carinho em cada detalhe da sua festa.',
  119.90, 30, '["Tudo do Festa Alegria","Mini-hambúrguer e batata frita","Bolo decorado simples","Bebidas não alcoólicas","Decoração básica da mesa"]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Festa Encanto');
INSERT INTO packages (name, description, price_per_guest, min_guests, features, highlighted)
SELECT 'Festa dos Sonhos', 'Uma experiência completa para celebrar em grande estilo.',
  159.90, 40, '["Tudo do Festa Encanto","Estação de massas","Mesa especial de doces","Decoração temática básica","Monitoria infantil"]'::jsonb, false
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Festa dos Sonhos');
