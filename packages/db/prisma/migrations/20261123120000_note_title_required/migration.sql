-- Изменено вручную: заметкам без заголовка — первая строка текста (без пробелов по краям,
-- не длиннее NOTE_TITLE_MAX = 200): заголовок становится обязательным.
UPDATE "Note"
SET "title" = left(btrim(split_part(btrim("content", E' \t\r\n'), E'\n', 1), E' \t\r'), 200)
WHERE "title" = '';

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "title" DROP DEFAULT;

-- Изменено вручную: Prisma видит generated-колонку как DEFAULT (SET DEFAULT ...); на деле меняется
-- выражение — поиск только по заголовку. SET EXPRESSION — с PostgreSQL 17, GIN-индекс перестроится.
ALTER TABLE "Note" ALTER COLUMN "search" SET EXPRESSION AS (to_tsvector('russian', "title"));
