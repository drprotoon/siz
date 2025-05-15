-- Adicionar colunas à tabela categories se não existirem
DO $$
BEGIN
    -- Verificar se a coluna parent_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
        ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id);
    END IF;

    -- Verificar se a coluna order existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'order') THEN
        ALTER TABLE categories ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Limpar categorias existentes
TRUNCATE categories CASCADE;

-- Reiniciar a sequência de IDs
ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- Inserir categorias principais
INSERT INTO categories (name, slug, description, image_url, parent_id, "order")
VALUES 
('Feminino', 'feminino', 'Produtos de beleza e cuidados pessoais para mulheres', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL, 1),
('Masculino', 'masculino', 'Produtos de beleza e cuidados pessoais para homens', 'https://images.unsplash.com/photo-1581750219816-c6e04d103c9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL, 2);

-- Inserir subcategorias para Feminino
INSERT INTO categories (name, slug, description, image_url, parent_id, "order")
VALUES 
('Perfumes Femininos', 'perfumes-femininos', 'Fragrâncias exclusivas para mulheres', 'https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, 1),
('Cabelos', 'cabelos', 'Produtos para cuidados com os cabelos', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, 2),
('Corpo e Banho', 'corpo-e-banho', 'Produtos para cuidados com o corpo e banho', 'https://images.unsplash.com/photo-1570194065650-d99fb4cb7300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, 3),
('Maquiagem', 'maquiagem', 'Produtos de maquiagem para realçar sua beleza', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, 4),
('Skincare', 'skincare', 'Produtos para cuidados com a pele', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, 5);

-- Inserir subcategorias para Masculino
INSERT INTO categories (name, slug, description, image_url, parent_id, "order")
VALUES 
('Perfumes Masculinos', 'perfumes-masculinos', 'Fragrâncias exclusivas para homens', 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 2, 1),
('Kits Masculinos', 'kits-masculinos', 'Kits completos para cuidados masculinos', 'https://images.unsplash.com/photo-1621607512214-68297480165e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 2, 2);
