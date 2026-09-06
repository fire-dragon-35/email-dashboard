import { ALL_MAIL_CATEGORY_ID } from './constants';
import type { CategorizedMessage } from './types';

const SAMPLE_SENDERS = [
  { from: 'Newsletter Weekly <hello@newsletterweekly.example>', subjects: ['🧠 This week in tech', "✨ Editor's picks", 'Your weekly digest'] },
  { from: 'Jordan Lee <jordan.lee@example.com>', subjects: ['Re: Project timeline', 'Meeting notes 📝', 'Quick question'] },
  { from: 'Online Store <receipts@onlinestore.example>', subjects: ['📦 Your order has shipped!', 'Order confirmation #48213', 'Receipt for your purchase'] },
  { from: 'Social Network <notifications@social.example>', subjects: ['🔔 You have 3 new notifications', '💬 Someone commented on your post', '🎉 New follower'] },
  { from: 'Team Standup <noreply@teamtools.example>', subjects: ["Today's standup summary", '📊 Sprint report'] },
  { from: 'Alex Rivera <alex.rivera@example.com>', subjects: ['🍕 Lunch next week?', 'Following up'] },
  { from: 'Pixel Fitness <buzz@pixelfitness.example>', subjects: ['🔥 You crushed your streak this week!', "Don't lose your 5-day streak 💪", 'New badge unlocked 🏅'] },
  { from: 'Weekend Brunch Co. <hello@weekendbrunch.example>', subjects: ['🥐 Your table is confirmed for Sat', '20% off pancakes this weekend 🥞'] },
  { from: 'Cloud Backup <status@cloudbackup.example>', subjects: ['✅ Backup complete', 'Storage almost full ⚠️'] },
  { from: 'Sam Okafor <sam.okafor@example.com>', subjects: ['🎂 Are you free for a birthday thing?', 'Photos from the trip 📸'] },
];

// Roughly a real inbox's daily rhythm — busier midweek, quieter weekends —
// so the demo chart has real-looking shape, not a flat line.
const DAILY_COUNTS = [3, 5, 2, 7, 4, 1, 2, 6, 8, 3, 5, 4, 2, 6];

function buildSampleMessages(): CategorizedMessage[] {
  const messages: CategorizedMessage[] = [];
  let uid = 1;

  DAILY_COUNTS.forEach((count, dayIndex) => {
    const daysAgo = DAILY_COUNTS.length - 1 - dayIndex;
    for (let i = 0; i < count; i++) {
      const sender = SAMPLE_SENDERS[(uid + dayIndex) % SAMPLE_SENDERS.length];
      const subject = sender.subjects[uid % sender.subjects.length];
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(8 + (i * 3) % 12, (uid * 7) % 60, 0, 0);

      messages.push({
        uid,
        date: date.toISOString(),
        from: sender.from,
        subject,
        flags: uid % 3 === 0 ? [] : ['\\Seen'],
        categoryId: ALL_MAIL_CATEGORY_ID,
      });
      uid += 1;
    }
  });

  return messages.sort((a, b) => b.date.localeCompare(a.date));
}

export const SAMPLE_MESSAGES: CategorizedMessage[] = buildSampleMessages();
