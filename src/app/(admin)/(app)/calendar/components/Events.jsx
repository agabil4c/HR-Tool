import { forwardRef } from 'react';
import { TbCircleFilled } from 'react-icons/tb';
const ExternalEvents = forwardRef(({ events = [] }, ref) => {
  return <div id="external-events" ref={ref} className="flex flex-col gap-3">
      <p className="text-default-400">Drag and drop your event or click in the calendar</p>

      {events.map(item => <div key={item.title} className={`external-event fc-event ${item.className.replace('!', '')}`} data-class={item.className}>
          <TbCircleFilled className="inline-block me-2" /> {item.title}
        </div>)}

      <div className="flex items-center gap-2">
        <input id="drop-remove" className="form-checkbox" type="checkbox" />
        <label htmlFor="drop-remove" className="align-middle cursor-pointer">
          Remove after drop
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input id="businessCalendar" className="form-checkbox" type="checkbox" />
        <label htmlFor="businessCalendar" className="align-middle cursor-pointer">
          Business Hours & Week
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input id="weekNumberCalendar" className="form-checkbox" type="checkbox" />
        <label htmlFor="weekNumberCalendar" className="align-middle cursor-pointer">
          Week Number
        </label>
      </div>
    </div>;
});
ExternalEvents.displayName = 'ExternalEvents';
export default ExternalEvents;