export interface MessageSummary {
  uid: number;
  date: string;
  from: string;
  subject: string;
  flags: string[];
}

export type ClientMessage =
  | { type: 'connect'; email: string; password: string }
  | { type: 'fetchMessages' }
  | { type: 'fetchBody'; uid: number }
  | { type: 'disconnect' };

export type ServerMessage =
  | { type: 'connected' }
  | { type: 'messages'; items: MessageSummary[] }
  | { type: 'body'; uid: number; raw: string }
  | { type: 'error'; message: string };
