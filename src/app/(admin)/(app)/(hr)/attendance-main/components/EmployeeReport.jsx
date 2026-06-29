import React from 'react';
import { LuBriefcase, LuUserCheck, LuUsers, LuUserX } from 'react-icons/lu';
const iconMap = {
  users: LuUsers,
  absent: LuUserX,
  present: LuUserCheck,
  days: LuBriefcase
};

const EmployeeReport = ({ reports = [] }) => {
  return <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
      {reports.map(({
      id,
      title,
      value,
      icon,
      color
    }) => {
      const Icon = iconMap[icon] || LuUsers;
      return <div key={id} className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className={`btn text-${color} bg-${color}/10 size-12`}>
                <Icon className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-base text-heading font-semibold">
                  <span className="counter-value">{value}</span>
                </h5>
                <p className="text-default-500">{title}</p>
              </div>
            </div>
          </div>
        </div>;
    })}
    </div>;
};
export default EmployeeReport;