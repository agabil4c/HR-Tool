import React, { useState } from 'react';
import { LuX } from 'react-icons/lu';

const EventModal = ({
  event,
  newEventData,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [title, setTitle] = useState(event ? event.title : '');
  const [category, setCategory] = useState(event?.classNames?.[0] ?? '!text-primary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const readOnly = Boolean(event?.extendedProps?.readOnly);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (readOnly) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);

      if (event) {
        const eventId = event?.extendedProps?.eventId;
        if (!eventId) {
          setError('This event cannot be edited.');
          return;
        }

        await onUpdateEvent?.(eventId, {
          title,
          classNames: [category]
        });
      } else if (newEventData) {
        await onCreateEvent?.({
          title,
          start: newEventData.dateStr,
          classNames: [category]
        });
      }

      onClose();
    } catch (submitError) {
      setError(submitError?.detail || submitError?.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || readOnly) {
      onClose();
      return;
    }

    const eventId = event?.extendedProps?.eventId;
    if (!eventId) {
      setError('This event cannot be deleted.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onDeleteEvent?.(eventId);
      onClose();
    } catch (deleteError) {
      setError(deleteError?.detail || deleteError?.message || 'Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center transition-all duration-200" role="dialog" aria-labelledby="event-modal-label">
      <div className="w-full max-w-lg card w-full flex flex-col border border-default-200 shadow-2xs rounded-xl pointer-events-auto">
        <div className="card-header flex justify-between items-center p-4">
          <h3 id="event-modal-label" className="font-semibold text-base text-default-800 dark:text-white">
            {event ? readOnly ? 'Holiday Details' : 'Edit Event' : 'Add Event'}
          </h3>
          <button type="button" className="text-default-800 hover:text-red-500" aria-label="Close" onClick={onClose}>
            <span className="sr-only">Close</span>
            <LuX className="size-5" />
          </button>
        </div>

        <form className="needs-validation" name="event-form" id="form-event" autoComplete="off" onSubmit={handleSubmit}>
          <div className="card-body p-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="event-title" className="inline-block mb-2 text-base font-medium">
                  Event Name
                </label>
                <input type="text" id="event-title" className="form-input w-full" placeholder="Event name" required value={title} onChange={e => setTitle(e.target.value)} readOnly={readOnly} />
              </div>

              <div>
                <label htmlFor="event-category" className="inline-block mb-2 text-base font-medium">
                  Category
                </label>
                <select className="form-input flex items-center w-full" name="event-category" id="event-category" required value={category} onChange={e => setCategory(e.target.value)} disabled={readOnly}>
                  <option value="">Select Category</option>
                  <option value="!text-primary">Primary</option>
                  <option value="!text-success">Success</option>
                  <option value="!text-info">Info</option>
                  <option value="!text-warning">Warning</option>
                  <option value="!text-danger">Danger</option>
                </select>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
          </div>

          <div className="card-footer flex gap-2 justify-end  p-4">
            <button type="button" onClick={onClose} className="bg-transparent text-danger btn border-0 hover:bg-red-50">
              Cancel
            </button>

            {event && !readOnly && <button type="button" onClick={handleDelete} id="btn-delete-event" className="bg-transparent text-danger btn border-0 hover:bg-red-50" disabled={isSubmitting}>
                Delete
              </button>}

            {!readOnly && <button type="submit" id="btn-save-event" className="btn bg-primary text-white" disabled={isSubmitting}>
                {event ? 'Update Event' : 'Add Event'}
              </button>}
          </div>
        </form>
      </div>
    </div>;
};
export default EventModal;