import React, { ChangeEvent, useState, useEffect, Fragment } from "react";
import Layout from "@/components/layout";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import Image from "next/image";
import Card from "@/components/Card";
import { dashboardAnalytics } from "@/util/constants";
import { handleDashboardData } from "@/services/transaction";
import Icon from "@/components/icon";
import useClickEvent from "@/stores/useClickEvent";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import WebPageTitle from "@/components/WebPageTitle";
import { populateCharts } from "@/services/transaction";

interface stateProps {
  isLoading: boolean;
  refreshChart: boolean;
  available_balance: string;
  ledger_balance: string;
  locked_balance: string;
  settlement_balance: string;
  total_disbursements: string;
  total_collections: string;
  transactions: any[];
  settlements: any[];
}

// const options = [
//   { value: "ngn", label: "NGN" },
//   { value: "usd", label: "USD" },
//   { value: "cad", label: "CAD" },
// ];

const secondOptions = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last One Month" },
  { value: "366", label: "Last One Year" },
];

const Dashboard = () => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const { isVisible, handleToggle } = useClickEvent();

  const [rotation, setRotation] = useState(0);
  const handleRefresh = (e: React.MouseEvent<HTMLSpanElement> | undefined) => {
    e?.stopPropagation();
    setRotation(rotation + 360);
    fetchDashboardData();
  };
  const [state, setState] = useState<stateProps>({
    isLoading: true,
    refreshChart: false,
    available_balance: "",
    ledger_balance: "",
    locked_balance: "",
    settlement_balance: "",
    total_disbursements: "",
    total_collections: "",
    transactions: [],
    settlements: [],
  });

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setSelectedOption(value);

    try {
      setState(prevState => ({
        ...prevState,
        refreshChart: true,
      }));
      const response = await populateCharts(value);
      setState(prevState => ({
        ...prevState,
        transactions: response,
      }));
    } catch (error) {
    } finally {
      setState(prevState => ({
        ...prevState,
        refreshChart: false,
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const response = await handleDashboardData();
    setState(prevState => ({
      ...prevState,
      isLoading: false,
    }));
    const { balances, transactions, settlements } = response;

    const {
      available_balance,
      ledger_balance,
      locked_balance,
      settlement_balance,
      total_disbursements,
      total_collections,
    } = balances?.data || {};
    setState(prevState => ({
      ...prevState,
      available_balance,
      ledger_balance,
      locked_balance,
      settlement_balance,
      transactions,
      settlements,
      total_disbursements,
      total_collections,
    }));
  };

  const lineChartProps = {
    secondOptions,
    selectedOption,
    handleChange,
  };
  const labels = state?.transactions?.map((label: any) => label.month);

  return (
    <Layout pageTitle="Dashboard" icon="dashboard">
      <WebPageTitle title="Dashboard | Ramp Merchant Portal" />
      <div>
        <div>
          <div className="flex xl:justify-between xl:grid xl:grid-cols-4 items-center gap-44 mb-2">
            <div className="flex items-center gap-3">
              <span className="col-span-2 text-2xl text-primary font-semibold">
                Balances
              </span>
              <div>
                <Image
                  src={
                    isVisible
                      ? "/images/eye-close-dark.svg"
                      : "/images/eye-on-dark.svg"
                  }
                  onClick={handleToggle}
                  className="cursor-pointer"
                  alt="Eye icons"
                  width={28}
                  height={28}
                  priority
                />
              </div>
            </div>
            <div className="relative">
              <Icon
                name="refresh"
                className={`md:absolute md:-top-2 cursor-pointer transition-transform duration-500 ease-in-out`}
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={e => handleRefresh(e)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.isLoading ? (
              <Card className="flex flex-col justify-between h-[200px] !bg-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                <div className="flex justify-end">
                  <Skeleton width={30} height={20} />
                </div>
                <div className="">
                  <div className="flex justify-between">
                    <span className="block w-[130px] rounded-lg pb-1">
                      <Skeleton className="h-2.5" />
                    </span>
                  </div>

                  <span className="block w-[100px] rounded-lg pb-1">
                    <Skeleton className="h-2.5" />
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap">
                  <span className="block w-[120px] rounded-lg pb-1">
                    <Skeleton className="h-2.5" />
                  </span>
                  <span className="block w-[100px] rounded-lg pb-1">
                    <Skeleton className="h-2.5" />
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="h-[200px] text-white flex flex-col justify-between !bg-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                <div className="flex justify-end">
                  <Icon name="wallet" />
                </div>

                <div>
                  <div className="flex justify-between">
                    <span className="text-lg">Available</span>
                  </div>

                  <div>
                    <h1 className="font-medium mt-2 text-xl">
                      {isVisible ? state.available_balance : "********"}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap">
                  <p className="text-xs">
                    Ledger:&nbsp;
                    <span className="font-semibold text-xs">
                      {isVisible ? state.ledger_balance : "********"}
                    </span>
                  </p>
                  <p className="text-xs">
                    Locked:&nbsp;
                    <span className="font-semibold text-xs">
                      {isVisible ? state.locked_balance : "********"}
                    </span>
                  </p>
                </div>
              </Card>
            )}

            {dashboardAnalytics.map((item: any, index: number) => (
              <Card
                key={index}
                className="flex flex-col justify-between h-[200px] text-black transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-white"
              >
                {state.isLoading ? (
                  <Fragment>
                    <div className="flex justify-end">
                      <Skeleton width={30} height={20} />
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between">
                        <span className="block w-[130px] rounded-lg pb-1">
                          <Skeleton className="h-2.5" />
                        </span>
                      </div>

                      <span className="block w-[100px] rounded-lg pb-1">
                        <Skeleton className="h-2.5" />
                      </span>
                    </div>
                    <div></div>
                  </Fragment>
                ) : (
                  <Fragment>
                    <div className="flex justify-end">
                      <Icon
                        name={
                          item.name.includes("Rolling Reserve Balance")
                            ? "outgoing"
                            : "incoming"
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between">
                        <span className="text-lg">{item.name}</span>
                      </div>

                      <div>
                        <h1 className="font-medium mt-2 text-xl">
                          {isVisible
                            ? item.name.includes("Rolling Reserve Balance")
                              ? state.total_disbursements
                              : state.total_collections
                            : "********"}
                        </h1>
                      </div>
                    </div>
                    <div></div>
                  </Fragment>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="hidden mt-6 md:grid md:grid-cols-1 xl:grid-cols-5 gap-4 w-full">
          <div className="xl:col-span-3">
            <LineChart
              labels={labels}
              chartData={state.transactions}
              lineChartProps={lineChartProps}
              isLoading={state.isLoading}
              isChartRefresh={state.refreshChart}
            />
          </div>

          <div className="md:col-span-2">
            <BarChart
              settlementBalance={state.settlement_balance}
              settlements={state.settlements}
              isLoading={state.isLoading}
              showBalance={isVisible}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
