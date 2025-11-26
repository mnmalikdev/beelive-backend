/**
 * Alert payload DTOs for WebSocket communication
 */

/**
 * Alert payload sent to WebSocket clients
 */
export interface AlertPayload {
  type: 'alert';
  action: 'triggered' | 'cleared';
  alert: {
    type: string;
    message: string;
    createdAt: Date;
    value?: number;
    hiveId: string;
  };
}

