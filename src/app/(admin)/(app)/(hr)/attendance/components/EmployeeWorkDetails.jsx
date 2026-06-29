import React from 'react';
import { LuClock, LuOctagonX, LuRefreshCw } from 'react-icons/lu';
const iconMap = {
  clock: LuClock,
  rejected: LuOctagonX,
  pending: LuRefreshCw
};

const EmployeeWorkDetails = ({ workDetails = [] }) => {
  return <div className="grid lg:grid-cols-3 grid-cols-1 gap-5 mb-5">
      {workDetails.map(detail => {
      const Icon = iconMap[detail.icon] || LuClock;
      return <div className="card" key={detail.id}>
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className={`btn ${detail.textColor} ${detail.bgColor} size-12`}>
                  <Icon className="size-6" />
                </div>
                <div>
                  <h5 className="mb-1 text-base text-heading font-semibold">
                    <span className="counter-value">{detail.value}</span>
                  </h5>
                  <p className="text-default-500">{detail.label}</p>
                </div>
              </div>
            </div>
          </div>;
    })}
    </div>;
};
export default EmployeeWorkDetails;