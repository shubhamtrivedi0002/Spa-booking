import { useState, useCallback, useEffect } from 'react';
import useBookingStore from '../store/bookingStore';
import useUiStore from '../store/uiStore';
import BookingForm from './BookingForm';
import { logger } from '../utils/logger';
import { BOOKING_STATUSES } from '../utils/constants';

function statusBadgeClass(status) {
  if (!status) return 'confirmed';
  const s = status.toLowerCase();
  if (s.includes('check') || s.includes('progress')) return 'checkin';
  if (s.includes('complete')) return 'completed';
  if (s.includes('cancel')) return 'cancelled';
  return 'confirmed';
}

export default function BookingPanel() {
  const selectedBooking = useBookingStore((s) => s.selectedBooking);
  const bookingDetails = useBookingStore((s) => s.bookingDetails);
  const fetchBookingDetails = useBookingStore((s) => s.fetchBookingDetails);
  const updateBookingStatus = useBookingStore((s) => s.updateBookingStatus);
  const cancelBooking = useBookingStore((s) => s.cancelBooking);
  const deleteBooking = useBookingStore((s) => s.deleteBooking);
  const clearSelectedBooking = useBookingStore((s) => s.clearSelectedBooking);

  const panelMode = useUiStore((s) => s.panelMode);
  const setPanelMode = useUiStore((s) => s.setPanelMode);
  const closePanel = useUiStore((s) => s.closePanel);
  const addToast = useUiStore((s) => s.addToast);

  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelType, setCancelType] = useState('normal');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [membershipDiscount, setMembershipDiscount] = useState(false);

  useEffect(() => {
    if (selectedBooking?.id && panelMode === 'view') {
      setLoading(true);
      fetchBookingDetails(selectedBooking.id)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [selectedBooking?.id, panelMode, fetchBookingDetails]);

  const handleClose = useCallback(() => {
    clearSelectedBooking();
    closePanel();
  }, [clearSelectedBooking, closePanel]);

  const handleStatusChange = useCallback(
    async (status) => {
      if (!selectedBooking?.id) return;
      try {
        setLoading(true);
        await updateBookingStatus(selectedBooking.id, status);
        await fetchBookingDetails(selectedBooking.id);
        addToast({ type: 'success', message: `Booking ${status}` });
        logger.action(`Booking status → ${status}`, { id: selectedBooking.id });
      } catch (error) {
        addToast({ type: 'error', message: error.message || 'Failed to update status' });
      } finally {
        setLoading(false);
      }
    },
    [selectedBooking?.id, updateBookingStatus, fetchBookingDetails, addToast]
  );

  const handleConfirmAction = useCallback(async () => {
    if (!selectedBooking?.id) return;
    try {
      setLoading(true);
      setShowConfirmModal(false);
      if (cancelType === 'delete') {
        await deleteBooking(selectedBooking.id);
        addToast({ type: 'success', message: 'Booking deleted' });
        logger.action('Booking deleted', { id: selectedBooking.id });
      } else {
        await cancelBooking(selectedBooking.id, cancelType);
        addToast({ type: 'success', message: 'Booking cancelled' });
        logger.action('Booking cancelled', { id: selectedBooking.id, type: cancelType });
      }
      handleClose();
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  }, [selectedBooking?.id, cancelType, cancelBooking, deleteBooking, addToast, handleClose]);

  /* === Create / Edit mode === */
  if (panelMode === 'create' || panelMode === 'edit') {
    const detail = bookingDetails?.data || bookingDetails || selectedBooking;
    return (
      <div className="booking-panel">
        <div className="panel-header">
          <h3>{panelMode === 'create' ? 'New Booking' : 'Edit Booking'}</h3>
          <button className="panel-close" onClick={handleClose}>×</button>
        </div>
        <div className="panel-body">
          <BookingForm
            booking={panelMode === 'edit' ? detail : null}
            onSuccess={() => {
              if (panelMode === 'edit') setPanelMode('view');
              else handleClose();
              addToast({ type: 'success', message: panelMode === 'create' ? 'Booking created' : 'Booking updated' });
            }}
            onCancel={handleClose}
          />
        </div>
      </div>
    );
  }

  /* === View mode === */
  const detail = bookingDetails?.data || bookingDetails || selectedBooking;
  const bi = detail?.booking_item;
  const items = bi
    ? Array.isArray(bi) ? bi : Object.values(bi).flat()
    : detail?.items || (detail?._item ? [detail._item] : []);

  const customerName = detail?.user?.name || detail?.customer?.name || detail?.customer_name || '';
  const customerLastName = detail?.user?.last_name || detail?.customer?.lastname || '';
  const customerInitials = `${(customerName[0] || '').toUpperCase()}${(customerLastName[0] || customerName[1] || '').toUpperCase()}`;
  const customerPhone = detail?.user?.contact_number || detail?.customer?.contact_number || detail?.mobile_number || '';
  const customerId = detail?.user?.id || detail?.customer?.id || '';
  const clientSince = detail?.user?.created_at || detail?.customer?.created_at || '';
  const isCancelled = (detail?.status || '').toLowerCase().includes('cancel');
  const isCompleted = (detail?.status || '').toLowerCase().includes('complete');
  const statusCls = statusBadgeClass(detail?.status);

  return (
    <div className="booking-panel">
      {/* Panel top bar */}
      <div className="panel-topbar">
        <div className="panel-topbar-left">
          <span className="topbar-label">Appointment</span>
        </div>
        <div className="panel-topbar-right">
          <div className="more-menu-wrap">
            <button className="btn-icon-sm" onClick={() => setShowMoreMenu(!showMoreMenu)} title="More">···</button>
            {showMoreMenu && (
              <div className="more-dropdown" onMouseLeave={() => setShowMoreMenu(false)}>
                <div className="more-item" onClick={() => { setShowMoreMenu(false); setCancelType('normal'); setShowConfirmModal(true); }}>Cancel / Delete</div>
              </div>
            )}
          </div>
          <button className="btn-icon-sm" onClick={() => setPanelMode('edit')} title="Edit">✏️</button>
        </div>
      </div>

      <div className="panel-body">
        {loading && <div className="loader-bar"><div className="loader-bar-inner" /></div>}

        {detail ? (
          <>
            {/* Status row with inline action */}
            <div className="panel-status-row">
              <span className={`status-dot ${statusCls}`} />
              <span className="status-text">{detail.status || 'Confirmed'}</span>
              {!isCancelled && !isCompleted && (
                <button
                  className="btn btn-checkin-inline"
                  onClick={() => handleStatusChange(BOOKING_STATUSES.CHECK_IN)}
                  disabled={loading}
                >
                  Check-in
                </button>
              )}
              {statusCls === 'checkin' && (
                <button
                  className="btn btn-gold btn-sm"
                  onClick={() => handleStatusChange(BOOKING_STATUSES.COMPLETED)}
                  disabled={loading}
                >
                  Complete
                </button>
              )}
              {!isCancelled && !isCompleted && (
                <button className="btn btn-gold btn-sm" style={{ marginLeft: 'auto' }}>View Sale</button>
              )}
            </div>

            {/* Date & Time */}
            <div className="panel-date-row">
              <span className="panel-date-label">On</span>
              <span className="panel-date-value">{detail.service_date || detail.service_at || '—'}</span>
              {items[0]?.start_time && (
                <>
                  <span className="panel-date-label" style={{ marginLeft: 'auto' }}>At</span>
                  <span className="panel-date-value">{items[0].start_time}</span>
                </>
              )}
            </div>

            <div className="panel-divider" />

            {/* Customer card */}
            <div className="customer-card">
              <div className="customer-avatar">{customerInitials}</div>
              <div className="customer-info">
                <div className="customer-name">
                  {customerId ? `${customerId} ` : ''}{customerName} {customerLastName}
                  {customerId && <span className="customer-id">(#{String(customerId).slice(0, 4)})</span>}
                </div>
                {clientSince && (
                  <div className="customer-since">Client since {clientSince}</div>
                )}
                {customerPhone && (
                  <div className="customer-meta">Phone: <strong>{customerPhone}</strong></div>
                )}
              </div>
            </div>

            {/* Membership discount toggle */}
            <div className="membership-row">
              <span className="membership-label">Apply membership discount:</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={membershipDiscount} onChange={(e) => setMembershipDiscount(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="panel-divider" />

            {/* Services / Items */}
            {items.map((itm, i) => {
              const serviceName = typeof itm.service === 'string' ? itm.service : (itm.service?.name || itm.service_name || 'Service');
              return (
                <div key={itm.id || i} className="panel-service-block">
                  <div className="service-title">{serviceName}</div>

                  <div className="service-detail-row">
                    <span className="sdl">With:</span>
                    <span className="sdv">
                      <span className="therapist-dot" /> {itm.therapist || 'Unassigned'}
                    </span>
                    {itm.requested_person === 1 && (
                      <span className="req-badge">☑ Requested Therapist ℹ</span>
                    )}
                    {itm.requested_person !== 1 && (
                      <span className="req-badge muted">☐ Requested Therapist ℹ</span>
                    )}
                  </div>

                  <div className="service-detail-row">
                    <span className="sdl">For:</span>
                    <span className="sdv">{itm.duration} min</span>
                    <span className="sdl" style={{ marginLeft: 16 }}>At:</span>
                    <span className="sdv">{itm.start_time}</span>
                    {!isCancelled && (
                      <>
                        <span className="sdl" style={{ marginLeft: 16 }}>Commission:</span>
                        <span className="sdv commission-select">Select</span>
                      </>
                    )}
                  </div>

                  {(itm.room_name || itm.room_items?.length > 0 || itm.room_segments?.length > 0) && (
                    <div className="service-detail-row">
                      <span className="sdl">Using:</span>
                      <span className="sdv">
                        {itm.room_name || itm.room_items?.[0]?.room_name || itm.room_segments?.[0]?.item_type || 'Room'}
                      </span>
                    </div>
                  )}

                  <div className="service-detail-row">
                    <span className="sdl">Select request(s):</span>
                    <span className="sdv">{itm.request_items || itm.select_requests || '—'}</span>
                  </div>
                </div>
              );
            })}

            {/* Notes */}
            {detail.note && (
              <div className="panel-notes-box">{detail.note}</div>
            )}

            <div className="panel-divider" />

            {/* Booking Details meta */}
            <div className="panel-booking-meta">
              <div className="meta-title">Booking Details</div>
              <div className="meta-row">
                <span className="meta-label">Booked on:</span>
                <span className="meta-value">{detail.created_at || detail.service_date || '—'}</span>
              </div>
              {detail.booked_by && (
                <div className="meta-row">
                  <span className="meta-label">Booked by:</span>
                  <span className="meta-value">{detail.booked_by}</span>
                </div>
              )}
              {detail.updated_at && (
                <div className="meta-row">
                  <span className="meta-label">Updated on:</span>
                  <span className="meta-value">{detail.updated_at}</span>
                </div>
              )}
              {detail.updated_by && (
                <div className="meta-row">
                  <span className="meta-label">Updated by:</span>
                  <span className="meta-value">{detail.updated_by}</span>
                </div>
              )}
              {isCancelled && detail.cancelled_at && (
                <div className="meta-row">
                  <span className="meta-label">Cancelled on:</span>
                  <span className="meta-value">{detail.cancelled_at}</span>
                </div>
              )}
              {isCancelled && detail.cancelled_by && (
                <div className="meta-row">
                  <span className="meta-label">Cancelled by:</span>
                  <span className="meta-value">{detail.cancelled_by}</span>
                </div>
              )}
              {detail.source && (
                <div className="meta-row">
                  <span className="meta-label">Source:</span>
                  <span className="meta-value">{detail.source}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Select a booking to view details</p>
          </div>
        )}
      </div>

      {/* Cancel / Delete Modal — Figma style */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Blue progress bar at top */}
            <div className="modal-progress-bar" />
            <div className="modal-body-inner">
              <h2 className="modal-title">Cancel / Delete Booking</h2>
              <p className="modal-subtitle">Please select the cancellation type.</p>

              <div className="modal-radio-group">
                <label className={`modal-radio${cancelType === 'normal' ? ' active' : ''}`}>
                  <input type="radio" name="ctype" checked={cancelType === 'normal'} onChange={() => setCancelType('normal')} />
                  <span>Normal Cancellation</span>
                </label>
                <label className={`modal-radio${cancelType === 'noshow' ? ' active' : ''}`}>
                  <input type="radio" name="ctype" checked={cancelType === 'noshow'} onChange={() => setCancelType('noshow')} />
                  <span>No Show</span>
                </label>
                <label className={`modal-radio${cancelType === 'delete' ? ' active' : ''}`}>
                  <input type="radio" name="ctype" checked={cancelType === 'delete'} onChange={() => setCancelType('delete')} />
                  <span>Just Delete It</span>
                </label>
              </div>

              {cancelType === 'delete' && (
                <p className="modal-warning">Bookings with a deposit cannot be deleted. Please cancel instead to retain a proper record.</p>
              )}
            </div>

            <div className="modal-footer-row">
              <button className="btn btn-modal-cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-modal-next" onClick={handleConfirmAction} disabled={loading}>
                {loading ? 'Processing...' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
