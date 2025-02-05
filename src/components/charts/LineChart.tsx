import React, { ChangeEvent, Fragment } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import Select from "../select";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.color = "black";

interface LineChartProps {
  secondOptions: any[];
  selectedOption: string;
  handleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}
interface ChartProps {
  labels: string[];
  chartData: any[];
  lineChartProps: LineChartProps;
  isLoading: boolean;
  isChartRefresh: boolean;
}

const LineChart = ({
  labels,
  chartData,
  lineChartProps,
  isLoading,
  isChartRefresh,
}: ChartProps) => {
  const { secondOptions, selectedOption, handleChange } = lineChartProps || {};
  return (
    <div className="bg-white pt-5 px-5 pb-10 rounded-xl h-[480px]">
      {isLoading ? (
        <Fragment>
          <div className="flex justify-between items-center">
            <span className="block w-[170px] rounded-lg pb-1">
              <Skeleton className="h-2.5" />
            </span>
            <Skeleton width={120} height={40} />
          </div>

          <div className="mt-16">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-2.5 mb-5" />
            ))}
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="flex justify-between items-center">
            <span className="block text-base font-medium text-grey-400">
              Disbursements and Collections
            </span>

            <div className="">
              {/* <Select
                options={options}
                value={selectedOption}
                onChange={handleChange}
              /> */}

              <Select
                options={secondOptions}
                value={selectedOption}
                onChange={handleChange}
                forCharts
              />
            </div>
          </div>

          {isChartRefresh ? (
            <div className="h-[480px] flex flex-col items-center justify-center">
              <svg
                className={`animate-spin w-10 text-[#164988]`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm font-medium mt-2">Loading chart data...</p>
            </div>
          ) : (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: "Disbursement",
                    data: chartData?.map((data: any) => data.disbursements),
                    fill: false,
                    borderColor: "#cc3a40",
                    backgroundColor: "#cc3a40",
                  },
                  {
                    label: "Collection",
                    data: chartData?.map((data: any) => data.collections),
                    fill: false,
                    borderColor: "#59bc79",
                    backgroundColor: "#59bc79",
                  },
                ],
              }}
              options={{
                elements: {
                  line: {
                    tension: 0.2,
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    labels: {
                      usePointStyle: true,
                      boxWidth: 6,
                      boxHeight: 6,
                    },
                  },
                },
                scales: {
                  y: {
                    grid: {
                      display: true,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          )}
        </Fragment>
      )}
    </div>
  );
};
export default LineChart;
