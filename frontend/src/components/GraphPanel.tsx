import { useId, useMemo } from 'react';
import { useMailData } from '../context/MailDataContext';
import type { DayVolume } from './graphPanelHelpers';
import { VolumeChart } from './VolumeChart';

// Fixed, not user-adjustable: daily bars only stay readable over a short
// window — 30 daily bars is already the upper end of "don't skip a label."
// A longer window needs a coarser bucket (weekly/monthly), which is a
// different chart, not a bigger version of this one.
const WINDOW_DAYS = 30;

function toLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function GraphPanel() {
  const { status, messages } = useMailData();
  const titleId = useId();

  const volumeByDay = useMemo<DayVolume[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDay = new Map<string, DayVolume>();
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toLocalDayKey(d);
      byDay.set(key, { day: key, total: 0 });
    }
    for (const message of messages) {
      const bucket = byDay.get(toLocalDayKey(new Date(message.date)));
      if (bucket) bucket.total += 1;
    }
    return [...byDay.values()];
  }, [messages]);

  if (status === 'loading') {
    return <p className="graph-panel__status">Loading your inbox…</p>;
  }
  if (status === 'error') {
    return <p className="graph-panel__status">Something went wrong fetching your inbox.</p>;
  }

  if (messages.length === 0) {
    return (
      <section className="graph-panel" aria-labelledby={titleId}>
        <h2 id={titleId} className="graph-panel__title">
          Email volume — last 30 days
        </h2>
        <p className="graph-panel__status">No emails to show yet.</p>
      </section>
    );
  }

  return (
    <section className="graph-panel" aria-labelledby={titleId}>
      <h2 id={titleId} className="graph-panel__title">
        Email volume — last 30 days
      </h2>
      <div className="graph-panel__chart" role="img" aria-label="Email volume per day, last 30 days">
        <VolumeChart data={volumeByDay} />
      </div>
    </section>
  );
}
