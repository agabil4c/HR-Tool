import { useEffect, useState } from 'react';
import { hrApi } from '@/services/hrApi';
import { LuX } from 'react-icons/lu';

const initialForm = {
  entryKind: 'holiday',
  type: 'Gazetted Holiday',
  name: '',
  date: '',
  eventCategory: 'Meeting'
};

const getFormFromRecord = record => {
  if (!record) {
    return initialForm;
  }

  if (record.sourceType === 'event') {
    return {
      entryKind: 'event',
      type: 'Gazetted Holiday',
      name: record.name || '',
      date: record.rawDate || '',
      eventCategory: record.type || 'Meeting'
    };
  }

  return {
    entryKind: 'holiday',
    type: record.type || 'Gazetted Holiday',
    name: record.name || '',
    date: record.rawDate || '',
    eventCategory: 'Meeting'
  };
};

const eventClassByType = {
  Meeting: '!text-primary',
  'Team Building': '!text-success',
  Workshop: '!text-info',
  'Town Hall': '!text-warning',
  'Urgent Event': '!text-danger'
};

const HoliydaysAdd = ({ isOpen, selectedRecord, onClose, onSaved }) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(getFormFromRecord(selectedRecord));
    setError('');
  }, [selectedRecord]);

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.date) {
      setError('Name and date are required.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (form.entryKind === 'event') {
        const payload = {
          title: form.name.trim(),
          start: form.date,
          classNames: [eventClassByType[form.eventCategory] || '!text-primary']
        };

        if (selectedRecord?.sourceType === 'event') {
          await hrApi.updateCalendarEvent(selectedRecord.recordId, payload);
        } else {
          await hrApi.createCalendarEvent(payload);
        }
      } else {
        const payload = {
          name: form.name.trim(),
          type: form.type,
          date: form.date
        };

        if (selectedRecord?.sourceType === 'holiday') {
          await hrApi.updatePublicHoliday(selectedRecord.recordId, payload);
        } else {
          await hrApi.createPublicHoliday(payload);
        }
      }

      setForm(initialForm);
      onSaved?.();
    } catch (submitError) {
      setError(submitError?.detail || submitError?.message || `Failed to save ${form.entryKind}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = Boolean(selectedRecord);

  if (!isOpen) {
    return null;
  }

  return <div className="fixed inset-0 z-80 bg-black/40 flex items-center justify-center p-3" role="dialog" tabIndex={-1} aria-labelledby="holidaysLeaveDeleteModal-label2">
      <div className="sm:max-w-lg sm:w-full w-full flex flex-col card border border-default-200 shadow-2xs rounded-xl bg-white">
          <div className="card-header">
            <h3 id="holidaysLeaveDeleteModal-label2" className="card-title">
              {isEditMode ? `Edit ${form.entryKind === 'holiday' ? 'Holiday' : 'Event'}` : 'Add Holiday or Event'}
            </h3>

            <div>
              <button type="button" className="size-5 text-default-800" aria-label="Close" onClick={onClose}>
                <span className="sr-only">Close</span>
                <LuX className="size-5" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-12">
                  <label htmlFor="entryKindSelect" className="inline-block mb-2 text-base font-medium">
                    Record Type
                  </label>
                  <select id="entryKindSelect" name="entryKindSelect" className="form-input" value={form.entryKind} onChange={event => handleFieldChange('entryKind', event.target.value)} disabled={isEditMode}>
                    <option value="holiday">Public Holiday</option>
                    <option value="event">Calendar Event</option>
                  </select>
                </div>

                <div className="lg:col-span-12">
                  <label htmlFor="typeSelect" className="inline-block mb-2 text-base font-medium">
                    {form.entryKind === 'holiday' ? 'Holiday Type' : 'Event Type'}
                  </label>
                  {form.entryKind === 'holiday' ? <select id="typeSelect" name="typeSelect" className="form-input" value={form.type} onChange={event => handleFieldChange('type', event.target.value)}>
                      <option value="Gazetted Holiday">Gazetted Holiday</option>
                      <option value="Observance">Observance</option>
                      <option value="Restricted Holiday">Restricted Holiday</option>
                      <option value="Season">Season</option>
                      <option value="Global Annual Holiday">Global Annual Holiday</option>
                    </select> : <select id="typeSelect" name="typeSelect" className="form-input" value={form.eventCategory} onChange={event => handleFieldChange('eventCategory', event.target.value)}>
                      <option value="Meeting">Meeting</option>
                      <option value="Team Building">Team Building</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Town Hall">Town Hall</option>
                      <option value="Urgent Event">Urgent Event</option>
                    </select>}
                </div>

                <div className="lg:col-span-12">
                  <label htmlFor="holidayInput" className="inline-block mb-2 text-base font-medium">
                    {form.entryKind === 'holiday' ? 'Holiday Name' : 'Event Name'}
                  </label>
                  <input type="text" id="holidayInput" value={form.name} onChange={event => handleFieldChange('name', event.target.value)} className="form-input bg-transparent border-default-200 focus:outline-none focus:border-primary placeholder:text-default-400" placeholder={form.entryKind === 'holiday' ? 'Holiday name' : 'Event name'} />
                </div>

                <div className="lg:col-span-12">
                  <label htmlFor="holidayDateInput" className="inline-block mb-2 text-base font-medium">
                    Date
                  </label>
                  <input id="holidayDateInput" type="date" value={form.date} onChange={event => handleFieldChange('date', event.target.value)} className="form-input" />
                </div>

                {error && <div className="lg:col-span-12 text-sm text-danger">{error}</div>}
              </div>
            </div>
            <div className="flex justify-end items-center gap-x-2 py-3 px-4">
              <button type="button" className="btn border-0 text-sm rounded-md text-danger bg-transparent transition-all duration-300 hover:bg-danger/10" aria-label="Close" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn bg-primary text-white disabled:opacity-60">
                {isEditMode ? 'Save Changes' : form.entryKind === 'holiday' ? 'Add Holiday' : 'Add Event'}
              </button>
            </div>
          </form>
      </div>
    </div>;
};

export default HoliydaysAdd;