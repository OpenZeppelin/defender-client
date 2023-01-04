import { NotificationType } from './notification';

// copied from /models/src/types/notification-category.req.d.ts
export interface SaveNotificationCategoryRequest {
  name: string;
  description?: string;
  /**
   * @maxItems 2
   */
  notificationIds: [] | [NotificationReference] | [NotificationReference, NotificationReference];
  stackResourceId?: string;
}

// copied from /models/src/types/notification-category.res.d.ts
export interface NotificationCategory {
  categoryId: string;
  name: string;
  description?: string;
  /**
   * @maxItems 2
   */
  notificationIds?: [] | [NotificationReference] | [NotificationReference, NotificationReference];
  stackResourceId?: string;
}
export interface NotificationReference {
  notificationId: string;
  type: NotificationType;
  sendCount?: number;
  [k: string]: unknown;
}

export type UpdateNotificationCategoryRequest = NotificationCategory;
export type CreateNotificationCategoryRequest = SaveNotificationCategoryRequest;
