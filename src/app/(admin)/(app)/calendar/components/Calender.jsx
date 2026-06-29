import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hrApi } from '@/services/hrApi';
import EventModal from './EventModal';
import ExternalEvents from './Events';
const CalendarApp = () => {
  const calendarRef = useRef(null);
  const externalEventsRef = useRef(null);
  const [calendarObj, setCalendarObj] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventData, setNewEventData] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);

  const loadModuleData = useCallback(async () => {
    try {
      const data = await hrApi.getModuleData('calendar');
      setCalendarEvents(data.events || []);
      setExternalEvents(data.externalEvents || []);
    } catch (error) {
      console.error('Failed to load calendar module data', error);
    }
  }, []);

  useEffect(() => {
    loadModuleData();
  }, [loadModuleData]);

  useEffect(() => {
    if (!calendarRef.current) return;
    if (externalEventsRef.current) {
      new Draggable(externalEventsRef.current, {
        itemSelector: '.external-event',
        eventData: eventEl => ({
          title: eventEl.innerText,
          classNames: eventEl.getAttribute('data-class')?.split(' ') || []
        })
      });
    }
    const calendar = new Calendar(calendarRef.current, {
      timeZone: 'local',
      editable: true,
      droppable: true,
      selectable: true,
      weekNumbers: false,
      initialView: 'dayGridMonth',
      themeSystem: 'standard',
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      headerToolbar: {
        left: 'prev,next,today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      events: calendarEvents,
      dateClick: info => {
        setShowModal(true);
        setSelectedEvent(null);
        setNewEventData(info);
      },
      eventClick: info => {
        setShowModal(true);
        setSelectedEvent(info.event);
        setNewEventData(null);
      },
      eventReceive: async info => {
        try {
          await hrApi.createCalendarEvent({
            title: info.event.title,
            start: info.event.startStr.slice(0, 10),
            classNames: info.event.classNames?.map(name => (name.startsWith('!') ? name : `!${name}`)) || ['!text-primary']
          });
          await loadModuleData();
        } catch (error) {
          console.error('Failed to persist dropped event', error);
          info.event.remove();
        }
      },
      drop: info => {
        const checkbox = document.getElementById('drop-remove');
        if (checkbox?.checked) {
          info.draggedEl.parentNode?.removeChild(info.draggedEl);
        }
      }
    });
    calendar.render();
    setCalendarObj(calendar);
    return () => {
      calendar.destroy();
    };
  }, []);

  useEffect(() => {
    if (!calendarObj) {
      return;
    }

    calendarObj.removeAllEvents();
    calendarObj.addEventSource(calendarEvents);
  }, [calendarObj, calendarEvents]);

  return <>
      <div className="lg:col-span-3">
        <div className="card">
          <div className="card-body">
            <div ref={calendarRef} id="calendar"></div>
          </div>
        </div>
      </div>

      <div className="col-span-1 card">
        <div className="card-body">
          <h6 className="mb-4 text-15">Draggable Events</h6>
          <ExternalEvents ref={externalEventsRef} events={externalEvents} />
        </div>
      </div>

      {showModal && <EventModal event={selectedEvent} newEventData={newEventData} onClose={() => setShowModal(false)} onCreateEvent={async payload => {
      await hrApi.createCalendarEvent(payload);
      await loadModuleData();
    }} onUpdateEvent={async (eventId, payload) => {
      await hrApi.updateCalendarEvent(eventId, payload);
      await loadModuleData();
    }} onDeleteEvent={async eventId => {
      await hrApi.deleteCalendarEvent(eventId);
      await loadModuleData();
    }} />}
    </>;
};
export default CalendarApp;