// copied from /models/src/types/notification-category.req.d.ts
export interface SaveNotificationCategoryRequest {
  name: string;
  description?: string;
  notificationIds: string[];
  stackResourceId?: string;
}

// copied from /models/src/types/notification-category.res.d.ts
export interface NotificationCategory {
  categoryId: string;
  name: string;
  description?: string;
  notificationIds?: string[];
  stackResourceId?: string;
}

export type UpdateNotificationCategoryRequest = NotificationCategory;
export type CreateNotificationCategoryRequest = SaveNotificationCategoryRequest;
