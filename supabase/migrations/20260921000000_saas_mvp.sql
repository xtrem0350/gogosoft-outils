-- Table shops (boutiques)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table shop_members (réparateurs ↔ boutiques)
CREATE TABLE IF NOT EXISTS shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','technicien')) DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

-- Table subscriptions (abonnements)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT CHECK (plan IN ('trial','mensuel','annuel')) DEFAULT 'trial',
  status TEXT CHECK (status IN ('active','expired','cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table payments (paiements simulés pour la démo)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  plan TEXT NOT NULL,
  provider TEXT DEFAULT 'cinetpay',
  status TEXT CHECK (status IN ('pending','success','failed')) DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table clients (clients de la boutique)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_repairs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_shop_members_user ON shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_clients_shop ON clients(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policies shops
CREATE POLICY "Members can view their shops" ON shops FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_members WHERE shop_id = shops.id AND user_id = auth.uid()));
CREATE POLICY "Owners can update their shops" ON shops FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "Authenticated users can create shops" ON shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policies shop_members
CREATE POLICY "Members can view shop members" ON shop_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_members sm WHERE sm.shop_id = shop_members.shop_id AND sm.user_id = auth.uid()));
CREATE POLICY "Owners can manage members" ON shop_members FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE id = shop_members.shop_id AND owner_id = auth.uid()));

-- Policies subscriptions
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users update own subscription" ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own subscription" ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policies payments
CREATE POLICY "Users view own payments" ON payments FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own payments" ON payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policies clients
CREATE POLICY "Members view shop clients" ON clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_members WHERE shop_id = clients.shop_id AND user_id = auth.uid()));
CREATE POLICY "Members manage shop clients" ON clients FOR ALL
  USING (EXISTS (SELECT 1 FROM shop_members WHERE shop_id = clients.shop_id AND user_id = auth.uid()));

-- Fonction pour créer automatiquement une subscription trial à l'inscription
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, expires_at)
  VALUES (NEW.id, 'trial', 'active', NOW() + INTERVAL '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_trial_subscription();
