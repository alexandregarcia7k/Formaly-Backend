-- ============================================
-- POST-MIGRATION SQL (OPCIONAL)
-- ============================================
-- Execute este SQL APÓS rodar: npx prisma migrate dev --name init
-- Adiciona otimizações que o Prisma não suporta nativamente

-- Índice parcial para forms que expiram (ignora nulls)
-- Otimização: Apenas 10-20% dos forms têm expiração
CREATE INDEX IF NOT EXISTS forms_expires_at_partial 
ON forms(expires_at) 
WHERE expires_at IS NOT NULL;

-- ============================================
-- COMO EXECUTAR
-- ============================================
-- Opção 1: Via psql
-- psql -d formaly_db -f prisma/post-migration.sql

-- Opção 2: Via Prisma
-- await prisma.$executeRawUnsafe(fs.readFileSync('prisma/post-migration.sql', 'utf-8'))
