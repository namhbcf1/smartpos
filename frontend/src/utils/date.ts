import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

export function formatDateTimeISO(value?: string | number | Date, tz: string = DEFAULT_TZ) {
  if (!value) return '';
  return dayjs(value).tz(tz).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(value?: string | number | Date, tz: string = DEFAULT_TZ) {
  if (!value) return '';
  return dayjs(value).tz(tz).format('DD/MM/YYYY');
}

export function nowISO(tz: string = DEFAULT_TZ) {
  return dayjs().tz(tz).toISOString();
}

