/**
 * Utility functions for Islamic (Hijri) Calendar formatting
 * Uses Intl.DateTimeFormat with Islamic Umalqura calendar support with safe fallback.
 */

export function getHijriDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return getFallbackHijriString(date);
  }
}

export function getHijriMonthString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'التقويم الهجري';
  }
}

export function getHijriMonthNameOnly(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
    }).format(date);
  } catch {
    return '';
  }
}

export function getHijriDayNumber(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function getHijriDayShort(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return getFallbackHijriString(date);
  }
}

// Algorithmic Kuwertz / Julian-day approximation fallback for environments without Intl islamic calendar support
function getFallbackHijriString(date: Date): string {
  const islamicMonths = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];
  
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Julian day number calculation
  let jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) +
    (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let hm = Math.floor((24 * l) / 709);
  let hd = l - Math.floor((709 * hm) / 24);
  let hy = 30 * n + j - 30;

  const monthName = islamicMonths[hm - 1] || 'هجري';
  return `${hd} ${monthName} ${hy} هـ`;
}
