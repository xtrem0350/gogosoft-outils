-- ============================================
-- Migration : Pseudo + connexion multi-identifiant
-- Date : 2026-09-23
-- ============================================

-- 1. Ajouter les colonnes manquantes à profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pseudo TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+225';

-- 2. Ajouter les contraintes UNIQUE (seulement si elles n'existent pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pseudo_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_pseudo_unique UNIQUE (pseudo);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- 3. Créer les index (maintenant que les colonnes existent)
CREATE INDEX IF NOT EXISTS idx_profiles_pseudo ON profiles(pseudo);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 4. Fonction RPC pour résoudre un identifiant (email, pseudo ou téléphone) en email
CREATE OR REPLACE FUNCTION get_email_by_identifier(identifier TEXT)
RETURNS TEXT AS $$
DECLARE
  found_email TEXT;
BEGIN
  -- Cas 1 : identifiant = email (contient @)
  IF identifier LIKE '%@%' THEN
    SELECT email INTO found_email
    FROM auth.users
    WHERE LOWER(email) = LOWER(identifier)
    LIMIT 1;
    RETURN found_email;
  END IF;

  -- Cas 2 : identifiant = pseudo (commence par une lettre)
  IF identifier ~ '^[a-zA-Z]' THEN
    SELECT u.email INTO found_email
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE LOWER(p.pseudo) = LOWER(identifier)
    LIMIT 1;
    RETURN found_email;
  END IF;

  -- Cas 3 : identifiant = téléphone (normalisé, chiffres uniquement)
  SELECT u.email INTO found_email
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(identifier, '[^0-9]', '', 'g')
  LIMIT 1;
  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Autoriser l'appel par les utilisateurs anonymes et authentifiés
GRANT EXECUTE ON FUNCTION get_email_by_identifier(TEXT) TO anon, authenticated;

-- 6. Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('pseudo', 'phone', 'phone_country_code', 'avatar_url')
ORDER BY column_name;