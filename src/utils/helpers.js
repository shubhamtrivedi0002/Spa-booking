import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDate(date, format = 'DD-MM-YYYY') {
  return dayjs(date).format(format);
}

export function parseApiDate(dateStr) {
  if (!dateStr) return null;
  return dayjs(dateStr, ['DD-MM-YYYY HH:mm', 'DD-MM-YYYY', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD']);
}

export function generateTimeSlots(startHour = 7, endHour = 23, interval = 15) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      slots.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        minutes: h * 60 + m,
      });
    }
  }
  return slots;
}

export function getBookingTop(startTime, slotHeight, startHour = 7) {
  const minutes = timeToMinutes(startTime);
  const offset = minutes - startHour * 60;
  return (offset / 15) * slotHeight;
}

export function getBookingHeight(duration, slotHeight) {
  return (duration / 15) * slotHeight;
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function groupBookingsByTherapist(bookings) {
  const map = new Map();
  if (!Array.isArray(bookings)) return map;

  for (const booking of bookings) {
    // booking_item is an object keyed by customer name, each value is an array of items
    const bi = booking.booking_item;
    const items = bi
      ? Array.isArray(bi)
        ? bi
        : Object.values(bi).flat()
      : booking.items || [];
    for (const item of items) {
      const tid = item.therapist_id ?? item.therapist?.id ?? item.therapist;
      if (tid == null) continue;
      // Store under both Number and String keys so lookups always match
      const numKey = Number(tid);
      if (!map.has(numKey)) map.set(numKey, []);
      map.get(numKey).push({ ...booking, _item: item });
    }
  }
  return map;
}

export function calculateEndTime(start, duration) {
  const [h, m] = start.split(':').map(Number);
  const totalMin = h * 60 + m + parseInt(duration);
  const eh = Math.floor(totalMin / 60) % 24;
  const em = totalMin % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}
