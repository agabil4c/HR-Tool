import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
const ApexChartClient = ({
  type,
  height,
  width = '100%',
  getOptions,
  series,
  className
}) => {
  const options = useMemo(() => getOptions(), []);
  return <ReactApexChart type={type} height={height} width={width} options={options} series={series} className={className} />;
};
export default ApexChartClient;