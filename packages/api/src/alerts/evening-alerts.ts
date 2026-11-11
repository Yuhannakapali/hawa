import { And, In, LessThan, MoreThanOrEqual, type DataSource } from 'typeorm';
import { Device } from '../db/entities/device.entity.js';
import { ForecastHour } from '../db/entities/forecast-hour.entity.js';
import { Site } from '../db/entities/site.entity.js';
import { dailyRatingFor } from '../forecast/forecast-view.js';
import type { PushMessage, PushSender } from '../push/push-sender.js';
import { addDays, nepalMidnightUtc, toNepalLocal } from '../time/nepal-time.js';

/** How long after a device's alert time it can still be sent, so a late job run is not lost. */
const ALERT_WINDOW_MINUTES = 60;
const MINUTES_PER_HOUR = 60;

export interface EveningAlertResult {
  sent: number;
  removed: number;
  failed: number;
}

function minutesOfDay(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours! * MINUTES_PER_HOUR + minutes!;
}

function isDue(device: Device, today: string, nowMinutes: number): boolean {
  if (device.lastAlertDate === today || device.alertSiteIds.length === 0) {
    return false;
  }
  const sinceAlert = nowMinutes - minutesOfDay(device.alertTime);
  return sinceAlert >= 0 && sinceAlert < ALERT_WINDOW_MINUTES;
}

function alertMessage(greenSites: Site[]): PushMessage {
  const first = greenSites[0]!;
  const names = greenSites.map((s) => s.name).join(', ');
  let title = `${first.name} looks flyable tomorrow`;
  if (greenSites.length > 1) {
    title = `${greenSites.length} of your sites look flyable tomorrow`;
  }
  return {
    title,
    body: `Green tomorrow: ${names}. Check the hourly score before you go.`,
    url: `/app/sites/${first.id}`,
  };
}

export async function sendEveningAlerts(
  db: DataSource,
  sender: PushSender,
  model: string,
  now: Date,
): Promise<EveningAlertResult> {
  const devices = db.getRepository(Device);
  const local = toNepalLocal(now);
  const nowMinutes = local.hour * MINUTES_PER_HOUR + local.minute;
  const due = (await devices.find()).filter((d) => isDue(d, local.date, nowMinutes));
  const result: EveningAlertResult = { sent: 0, removed: 0, failed: 0 };
  if (due.length === 0) {
    return result;
  }

  const tomorrow = addDays(local.date, 1);
  const siteIds = [...new Set(due.flatMap((d) => d.alertSiteIds))];
  const sites = await db.getRepository(Site).findBy({ id: In(siteIds), active: true });
  const rows = await db.getRepository(ForecastHour).findBy({
    siteId: In(sites.map((s) => s.id)),
    model,
    timeUtc: And(
      MoreThanOrEqual(nepalMidnightUtc(tomorrow)),
      LessThan(nepalMidnightUtc(addDays(tomorrow, 1))),
    ),
  });

  for (const device of due) {
    const greenSites = sites
      .filter((site) => device.alertSiteIds.includes(site.id))
      .filter((site) => {
        const siteRows = rows.filter((r) => r.siteId === site.id);
        return dailyRatingFor(siteRows, device.level, tomorrow) === 'green';
      });

    try {
      if (greenSites.length > 0) {
        const outcome = await sender.send(device.platform, device.token, alertMessage(greenSites));
        if (outcome === 'gone') {
          await devices.delete({ id: device.id });
          result.removed += 1;
          continue;
        }
        result.sent += 1;
      }
      await devices.update({ id: device.id }, { lastAlertDate: local.date });
    } catch {
      result.failed += 1;
    }
  }
  return result;
}
