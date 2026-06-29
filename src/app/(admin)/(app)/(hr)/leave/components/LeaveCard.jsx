import { LuCalendarCheck, LuCodepen, LuFileChartColumn, LuLoader } from 'react-icons/lu';
const iconMap = {
  present: LuFileChartColumn,
  today: LuCalendarCheck,
  unplanned: LuCodepen,
  remaining: LuLoader
};

const LeaveCard = ({ leaveData = [] }) => {
  return <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
      {leaveData.map(({
      id,
      value,
      description,
      icon,
      textColor,
      bgColor
    }) => {
      const Icon = iconMap[icon] || LuFileChartColumn;
      return <div key={id} className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className={`btn ${textColor} ${bgColor} size-12`}>
                <Icon className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-base text-heading font-semibold">{value}</h5>
                <p className="text-default-500">{description}</p>
              </div>
            </div>
          </div>
        </div>;
    })}
    </div>;
};
export default LeaveCard;