import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { imapRelayClient } from '../imap/imapRelayClientSingleton';
import { ALL_MAIL_CATEGORY_ID } from '../lib/constants';
import { Logger } from '../lib/Logger';
export type { CategorizedMessage } from '../lib/types';

export { ALL_MAIL_CATEGORY_ID };

const logger = Logger.get('MailDataContext');

export interface Category {
  id: string;
  name: string;
  color: string;
}

type MailDataStatus = 'loading' | 'ready' | 'error';

interface MailDataValue {
  status: MailDataStatus;
  categories: Category[];
  messages: CategorizedMessage[];
  countsByCategory: Record<string, number>;
  selectedCategoryId: string;
  selectCategory: (id: string) => void;
}

const MailDataContext = createContext<MailDataValue | null>(null);

interface MailDataProviderProps {
  children: ReactNode;
  // For the landing-page demo: seeds real data with no relay connection,
  // so the real GraphPanel/EmailList render against sample data instead
  // of a separate mockup. Fetching never happens while this is set.
  demoMessages?: CategorizedMessage[];
}

export function MailDataProvider({ children, demoMessages }: MailDataProviderProps) {
  const [status, setStatus] = useState<MailDataStatus>(demoMessages ? 'ready' : 'loading');
  const [messages, setMessages] = useState<CategorizedMessage[]>(demoMessages ?? []);
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_MAIL_CATEGORY_ID);

  useEffect(() => {
    if (demoMessages) return;
    let cancelled = false;

    async function load() {
      try {
        const items = await imapRelayClient.fetchMessages();
        if (cancelled) return;
        setMessages(items.map((item) => ({ ...item, categoryId: ALL_MAIL_CATEGORY_ID })));
        setStatus('ready');
      } catch (err) {
        logger.error('Failed to fetch messages', err);
        if (!cancelled) setStatus('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [demoMessages]);

  const categories = useMemo<Category[]>(
    () => [{ id: ALL_MAIL_CATEGORY_ID, name: 'All Mail', color: 'var(--chart-series-1)' }],
    [],
  );

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const message of messages) {
      counts[message.categoryId] = (counts[message.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [messages]);

  const selectCategory = useCallback((id: string) => setSelectedCategoryId(id), []);

  const value = useMemo<MailDataValue>(
    () => ({
      status,
      categories,
      messages,
      countsByCategory,
      selectedCategoryId,
      selectCategory,
    }),
    [status, categories, messages, countsByCategory, selectedCategoryId, selectCategory],
  );

  return <MailDataContext.Provider value={value}>{children}</MailDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- standard React context pattern: the provider and its consumer hook belong in one small, cohesive file, not split just for Fast Refresh purity
export function useMailData(): MailDataValue {
  const value = useContext(MailDataContext);
  if (!value) throw new Error('useMailData must be used within a MailDataProvider');
  return value;
}
