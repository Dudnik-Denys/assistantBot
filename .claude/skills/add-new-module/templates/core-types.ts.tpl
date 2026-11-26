// DTO выводится из схемы ответа (`schemas/__entities__/__entity__-dto.ts`); здесь — реэкспорт
// для сервиса и `index.ts`, плюс интерфейсы, которые из схем не выводятся (внутренние для core).
export type { __Entity__Dto } from '../schemas/__entities__/__entity__-dto.ts';
