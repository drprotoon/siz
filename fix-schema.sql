-- Script para corrigir o schema do banco de dados
-- Renomear colunas para usar snake_case consistente

-- Verificar se a coluna compareatprice existe e renomeá-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'compareatprice'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products RENAME COLUMN compareatprice TO compare_at_price;
        RAISE NOTICE 'Coluna compareatprice renomeada para compare_at_price';
    END IF;
END $$;

-- Verificar se a coluna howToUse existe e renomeá-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'howtouse'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products RENAME COLUMN howtouse TO how_to_use;
        RAISE NOTICE 'Coluna howtouse renomeada para how_to_use';
    END IF;
END $$;

-- Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar compare_at_price se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'compare_at_price'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN compare_at_price NUMERIC(10,2);
        RAISE NOTICE 'Coluna compare_at_price adicionada';
    END IF;

    -- Adicionar how_to_use se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'how_to_use'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN how_to_use TEXT;
        RAISE NOTICE 'Coluna how_to_use adicionada';
    END IF;

    -- Adicionar ingredients se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'ingredients'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN ingredients TEXT;
        RAISE NOTICE 'Coluna ingredients adicionada';
    END IF;

    -- Adicionar visible se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'visible'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN visible BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Coluna visible adicionada';
    END IF;

    -- Adicionar featured se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'featured'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna featured adicionada';
    END IF;

    -- Adicionar new_arrival se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'new_arrival'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN new_arrival BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna new_arrival adicionada';
    END IF;

    -- Adicionar best_seller se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'best_seller'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN best_seller BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna best_seller adicionada';
    END IF;

    -- Adicionar rating se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN rating NUMERIC(3,1) DEFAULT 0;
        RAISE NOTICE 'Coluna rating adicionada';
    END IF;

    -- Adicionar reviewcount se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'reviewcount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE products ADD COLUMN reviewcount INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna reviewcount adicionada';
    END IF;
END $$;

-- Verificar o schema final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
