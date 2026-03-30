import { useState, useCallback, useEffect, useMemo } from 'react';
import useBookingStore from '../store/bookingStore';
import useTherapistStore from '../store/therapistStore';
import useServiceStore from '../store/serviceStore';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { fetchRooms } from '../api/rooms';
import { fetchUsers, createUser } from '../api/users';
import { BOOKING_SOURCES } from '../utils/constants';
import { formatDate, calculateEndTime } from '../utils/helpers';
import { logger } from '../utils/logger';
import dayjs from 'dayjs';

export default function BookingForm({ booking, onSuccess, onCancel }) {
  const createBooking = useBookingStore((s) => s.createBooking);
  const updateBooking = useBookingStore((s) => s.updateBooking);
  const therapists = useTherapistStore((s) => s.therapists);
  const fetchTherapists = useTherapistStore((s) => s.fetchTherapists);
  const categories = useServiceStore((s) => s.categories);
  const fetchCategories = useServiceStore((s) => s.fetchCategories);
  const addToast = useUiStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);

  const isEdit = !!booking;
  // booking_item is object keyed by customer name; flatten to get first item
  const bi = booking?.booking_item;
  const allItems = bi
    ? Array.isArray(bi) ? bi : Object.values(bi).flat()
    : booking?.items || [];
  const item = allItems[0] || booking?._item || {};

  const [form, setForm] = useState({
    customer: booking?.user?.id || booking?.customer?.id || booking?.customer || '',
    customerSearch: booking?.user?.name
      ? `${booking.user.name} ${booking.user.last_name || ''}`
      : booking?.customer?.name
        ? `${booking.customer.name} ${booking.customer.lastname || ''}`
        : booking?.customer_name || '',
    service: item.service_id || item.service?.id || item.service || '',
    therapist: item.therapist_id || item.therapist?.id || item.therapist || '',
    date: booking?.service_date
      ? dayjs(booking.service_date, 'DD-MM-YYYY').format('YYYY-MM-DD')
      : booking?.service_at
        ? dayjs(booking.service_at, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
    startTime: item.start_time ? (item.start_time.length > 5 ? item.start_time.substring(0, 5) : item.start_time) : '09:00',
    duration: item.duration || 60,
    room: item.room_id || item.room_segments?.[0]?.room_id || '',
    source: booking?.source || 'Walk-in',
    note: booking?.note || '',
    price: item.price || '0.00',
    requestedPerson: item.requested_person === 1 ? true : false,
    requestedRoom: item.requested_room === 1 ? true : false,
  });
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', lastname: '', email: '', contact_number: '' });

  useEffect(() => {
    if (categories.length === 0) fetchCategories().catch(() => {});
    if (therapists.length === 0) fetchTherapists().catch(() => {});
  }, []);

  /* Flatten service list */
  const services = useMemo(() => {
    const list = [];
    for (const cat of categories) {
      if (cat.services) {
        for (const svc of cat.services) {
          list.push({ ...svc, categoryName: cat.name });
        }
      }
    }
    return list;
  }, [categories]);

  /* Load rooms when date changes */
  useEffect(() => {
    if (form.date) {
      fetchRooms(formatDate(form.date, 'DD-MM-YYYY'), form.duration)
        .then((data) => {
          const raw = data?.data || [];
          // Rooms API returns [{room_id, room_name, items: [{item_id, item_name, bookings}]}]
          // Flatten to individual room items (beds) for the dropdown
          const flatRooms = [];
          if (Array.isArray(raw)) {
            for (const room of raw) {
              if (Array.isArray(room.items)) {
                for (const item of room.items) {
                  flatRooms.push({
                    id: item.item_id,
                    name: item.item_name || `${room.room_name} - ${item.item}`,
                    roomName: room.room_name,
                    bookings: item.bookings || [],
                  });
                }
              } else {
                // Fallback: use room itself
                flatRooms.push({
                  id: room.room_id || room.id,
                  name: room.room_name || room.name || `Room ${room.room_id || room.id}`,
                  bookings: [],
                });
              }
            }
          }
          setRooms(flatRooms);
        })
        .catch(() => setRooms([]));
    }
  }, [form.date, form.duration]);

  const handleChange = useCallback((field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: null }));
  }, []);

  const searchCustomers = useCallback(async (query) => {
    if (query.length < 2) {
      setCustomers([]);
      setShowCreateClient(false);
      return;
    }
    try {
      const data = await fetchUsers({ search_text: query, pagination: 1 });
      const users = data?.data?.data?.list?.users || data?.data?.data?.list || data?.data?.data || [];
      const list = Array.isArray(users) ? users : [];
      setCustomers(list);
      setShowCreateClient(list.length === 0);
    } catch {
      setCustomers([]);
      setShowCreateClient(true);
    }
  }, []);

  const handleCreateClient = useCallback(async () => {
    if (!newClient.name) {
      setErrors((p) => ({ ...p, customer: 'Client name is required' }));
      return;
    }
    try {
      setLoading(true);
      const data = await createUser(newClient);
      const created = data?.data?.data || data?.data || data;
      if (created?.id) {
        handleChange('customer', created.id);
        handleChange('customerSearch', `${created.name || newClient.name} ${created.lastname || newClient.lastname || ''}`);
        addToast({ type: 'success', message: 'Client created' });
      }
      setShowCreateClient(false);
      setNewClient({ name: '', lastname: '', email: '', contact_number: '' });
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Failed to create client' });
    } finally {
      setLoading(false);
    }
  }, [newClient, handleChange, addToast]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.customer) e.customer = 'Customer is required';
    if (!form.service) e.service = 'Service is required';
    if (!form.therapist) e.therapist = 'Therapist is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (!form.duration || form.duration < 15) e.duration = 'Min 15 min';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      try {
        const endTime = calculateEndTime(form.startTime, form.duration);
        const serviceAt = `${formatDate(form.date, 'DD-MM-YYYY')} ${form.startTime}`;

        const itemData = {
          service: parseInt(form.service),
          start_time: form.startTime,
          end_time: endTime,
          duration: parseInt(form.duration),
          therapist: parseInt(form.therapist),
          requested_person: form.requestedPerson ? 1 : 0,
          requested_room: form.requestedRoom ? 1 : 0,
          price: form.price || '0.00',
          quantity: '1',
          service_request: '',
          commission: null,
          customer_name: form.customerSearch,
          primary: 1,
          item_number: 1,
          room_segments: form.room
            ? [
                {
                  room_id: parseInt(form.room),
                  item_type: 'single-bed',
                  meta_service: null,
                  start_time: form.startTime,
                  end_time: endTime,
                  duration: parseInt(form.duration),
                  priority: 1,
                },
              ]
            : [],
        };

        if (isEdit && item.id) itemData.id = item.id;

        const payload = {
          customer: String(form.customer),
          service_at: serviceAt,
          items: JSON.stringify([itemData]),
          source: form.source,
          note: form.note,
          created_by: String(user?.id || ''),
          updated_by: String(user?.id || ''),
        };

        if (isEdit) {
          await updateBooking(booking.id, payload);
          logger.action('Booking updated', { id: booking.id });
        } else {
          await createBooking(payload);
          logger.action('Booking created');
        }

        onSuccess?.();
      } catch (error) {
        addToast({ type: 'error', message: error.message || 'Failed to save booking' });
        logger.error('Booking save failed', { error: error.message });
      } finally {
        setLoading(false);
      }
    },
    [form, isEdit, booking, item, validate, createBooking, updateBooking, addToast, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Customer */}
      <div className="form-group">
        <label>Customer *</label>
        <input
          className={`form-input${errors.customer ? ' error' : ''}`}
          placeholder="Search customer..."
          value={form.customerSearch}
          onChange={(e) => {
            handleChange('customerSearch', e.target.value);
            searchCustomers(e.target.value);
          }}
        />
        {customers.length > 0 && (
          <div className="dropdown-list">
            {customers.map((c) => (
              <div
                key={c.id}
                className="dropdown-item"
                onClick={() => {
                  handleChange('customer', c.id);
                  handleChange('customerSearch', `${c.name} ${c.lastname || ''}`);
                  setCustomers([]);
                  setShowCreateClient(false);
                }}
              >
                {c.name} {c.lastname || ''}{' '}
                <span className="text-muted">
                  {c.email || c.contact_number || ''}
                </span>
              </div>
            ))}
          </div>
        )}
        {showCreateClient && (
          <div className="create-client-form">
            <div className="create-client-header">No clients found — create new:</div>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="First name *"
                value={newClient.name}
                onChange={(e) => setNewClient((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="form-input"
                placeholder="Last name"
                value={newClient.lastname}
                onChange={(e) => setNewClient((p) => ({ ...p, lastname: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <input
                className="form-input"
                placeholder="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="form-input"
                placeholder="Phone"
                value={newClient.contact_number}
                onChange={(e) => setNewClient((p) => ({ ...p, contact_number: e.target.value }))}
              />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateClient} disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        )}
        {errors.customer && <div className="form-error">{errors.customer}</div>}
      </div>

      {/* Service */}
      <div className="form-group">
        <label>Service *</label>
        <select
          className={`form-select${errors.service ? ' error' : ''}`}
          value={form.service}
          onChange={(e) => {
            handleChange('service', e.target.value);
            const svc = services.find((s) => String(s.id) === e.target.value);
            if (svc) {
              handleChange('duration', svc.duration || 60);
              handleChange('price', svc.price || '0.00');
            }
          }}
        >
          <option value="">Select service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration || 60}min – ${s.price || '0.00'})
            </option>
          ))}
        </select>
        {errors.service && <div className="form-error">{errors.service}</div>}
      </div>

      {/* Therapist */}
      <div className="form-group">
        <label>Therapist *</label>
        <select
          className={`form-select${errors.therapist ? ' error' : ''}`}
          value={form.therapist}
          onChange={(e) => handleChange('therapist', e.target.value)}
        >
          <option value="">Select therapist...</option>
          {(Array.isArray(therapists) ? therapists : []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.alias || t.name || 'Unknown'} {t.lastname || ''} ({t.gender || 'N/A'})
            </option>
          ))}
        </select>
        {errors.therapist && <div className="form-error">{errors.therapist}</div>}
      </div>

      {/* Date & Start Time */}
      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Date *</label>
          <input
            type="date"
            className={`form-input${errors.date ? ' error' : ''}`}
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
          {errors.date && <div className="form-error">{errors.date}</div>}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Start Time *</label>
          <input
            type="time"
            className={`form-input${errors.startTime ? ' error' : ''}`}
            value={form.startTime}
            step="900"
            onChange={(e) => handleChange('startTime', e.target.value)}
          />
          {errors.startTime && <div className="form-error">{errors.startTime}</div>}
        </div>
      </div>

      {/* Duration */}
      <div className="form-group">
        <label>Duration (minutes) *</label>
        <select
          className="form-select"
          value={form.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
        >
          {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240].map((d) => (
            <option key={d} value={d}>
              {d} min
            </option>
          ))}
        </select>
        {errors.duration && <div className="form-error">{errors.duration}</div>}
      </div>

      {/* Room */}
      <div className="form-group">
        <label>Room</label>
        <select
          className="form-select"
          value={form.room}
          onChange={(e) => handleChange('room', e.target.value)}
        >
          <option value="">No room selected</option>
          {(Array.isArray(rooms) ? rooms : []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name || r.title || `Room ${r.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Request Type */}
      <div className="form-group">
        <label>Request Preferences</label>
        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.requestedPerson}
              onChange={(e) => handleChange('requestedPerson', e.target.checked)}
            />
            Requested Therapist
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.requestedRoom}
              onChange={(e) => handleChange('requestedRoom', e.target.checked)}
            />
            Requested Room
          </label>
        </div>
      </div>

      {/* Source */}
      <div className="form-group">
        <label>Source</label>
        <select
          className="form-select"
          value={form.source}
          onChange={(e) => handleChange('source', e.target.value)}
        >
          {BOOKING_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label>Notes</label>
        <textarea
          className="form-textarea"
          value={form.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Add notes..."
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Booking'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
