import { useEffect, useMemo, useState } from 'react';
import { hrApi } from '@/services/hrApi';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';

const formatSummaryDate = value => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const UpcomingEventsSummary = ({
  title = 'Upcoming Events & Holidays',
  maxItems = 3,
  className = 'mb-5',
  contentClassName = ''
}) => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const data = await hrApi.getDashboardUpcomingEvents();
        if (!isMounted) {
          return;
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError?.detail || loadError?.message || 'Failed to load upcoming events');
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayItems = useMemo(() => items.slice(0, maxItems), [items, maxItems]);

  return <div className={`card rounded-2xl border border-default-200 ${className}`.trim()}>
      <div className="card-header flex items-center justify-between">
        <h5 className="text-default-800 text-base font-semibold">{title}</h5>
        <span className="text-xs text-default-500">{displayItems.length} items</span>
      </div>
      <div className={`card-body ${contentClassName}`.trim()}>
        {error && <p className="text-sm text-danger">{error}</p>}

        {!error && displayItems.length === 0 && <div className="text-sm text-default-500">
            No upcoming events or holidays.
          </div>}

        {!error && displayItems.length > 0 && <div className="space-y-3">
            {displayItems.map(item => <div key={item.id} className="flex items-start justify-between gap-3 border border-default-200 rounded-md p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <IconifyIcon icon={item.kind === 'Holiday' ? 'solar:confetti-minimalistic-bold-duotone' : 'solar:calendar-mark-bold-duotone'} className={item.kind === 'Holiday' ? 'text-danger' : 'text-primary'} />
                    <p className="text-sm font-semibold text-default-900 truncate">{item.title}</p>
                  </div>
                  <p className="text-xs text-default-500 mt-1">{item.kind} • {item.type}</p>
                </div>
                <span className="text-xs font-medium text-default-600 whitespace-nowrap">{formatSummaryDate(item.date)}</span>
              </div>)}
          </div>}
      </div>
    </div>;
};

export default UpcomingEventsSummary;
