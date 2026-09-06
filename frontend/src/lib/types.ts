import type { MessageSummary } from '../imap/protocol';

export interface CategorizedMessage extends MessageSummary {
  categoryId: string;
}
