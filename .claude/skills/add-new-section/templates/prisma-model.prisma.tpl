/// __Title__. Поле title — пример, замени на реальные поля раздела.
model __Entity__ {
  id        String   @id @default(uuid(7)) @db.Uuid
  userId    String   @db.Uuid
  title     String
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, updatedAt(sort: Desc)])
}

// В модель User добавить обратную связь:
//   __entities__ __Entity__[]
