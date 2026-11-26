import { IdSchema } from '@tgab/core';
import { z } from 'zod';

/** Данные задачи отправки уведомления: из Redis приходят без типов — проверяются схемой. */
export const NotificationJobDataSchema = z.object({ notificationId: IdSchema });

export type NotificationJobData = z.infer<typeof NotificationJobDataSchema>;
