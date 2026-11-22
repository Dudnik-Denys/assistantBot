import path from 'node:path';

/** Папка `tests/`. */
export const TESTS_DIR = path.resolve(import.meta.dirname, '..');
/** Корень репозитория: отсюда запускаются `bun test`, docker compose и миграции. */
export const ROOT_DIR = path.resolve(TESTS_DIR, '..');
