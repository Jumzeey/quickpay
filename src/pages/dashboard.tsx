import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Icon from "@/components/icon";
import Layout from "@/components/layout";
import Switch from "@/components/Switch";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { handleDashboardData, populateCharts } from "@/services/transaction";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import { capitalizeFirstLetter, copyToClipboard, currencySymbols, formatBalance, notifyError } from "@/util/utils";
import Link from "next/link";
import React, { ChangeEvent, useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

type DashboardProps = {};
type StateProps = {
  isLoading: boolean;
  wallet_id: string | null;
  refreshChart: boolean;
  available_balance: string;
  ledger_balance: string;
  locked_balance: string;
  settlement_balance: string;
  rolling_reserve: string;
  rolling_reserve_ledger: string;
  total_disbursements: string;
  total_collections: string;
  transactions: any[];
  settlements: any[];
}

const Dashboard = () => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const { firstname } = useAuthentication().user || {};
  const [showBalance, setShowBalance] = useState(true);
  const [rotation, setRotation] = useState(0);
  const { selectedCurrency, getCurrencyFlag } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    wallet_id: null,
    refreshChart: false,
    available_balance: "",
    ledger_balance: "",
    locked_balance: "",
    settlement_balance: "",
    rolling_reserve: "",
    rolling_reserve_ledger: "",
    total_collections: "",
    total_disbursements: "",
    transactions: [],
    settlements: [],
  });

  const handleToggle = () => setShowBalance(!showBalance);

  const { loading: isDashboardLoading } = useEffectFetch(
    async () => {
      return await handleDashboardData(selectedCurrency);
    },
    [selectedCurrency, mounted],
    {
      enabled: Boolean(mounted && selectedCurrency),
      onSuccess: (response) => {
        const { balances, transactions, settlements, merchantBalance } = response;
        const { settlement_balance, total_collections, total_disbursements, accounts } = merchantBalance || {};

        if (accounts?.message?.toLowerCase() === "no accounts found") {
          setState(prev => ({
            ...prev,
            isLoading: false,
            wallet_id: "N/A",
            available_balance: `${currencySymbols[selectedCurrency]}0.00`,
            ledger_balance: `${currencySymbols[selectedCurrency]}0.00`,
            locked_balance: `${currencySymbols[selectedCurrency]}0.00`,
            settlement_balance: `${currencySymbols[selectedCurrency]}0.00`,
            rolling_reserve: `${currencySymbols[selectedCurrency]}0.00`,
            rolling_reserve_ledger: `${currencySymbols[selectedCurrency]}0.00`,
            total_collections: `${currencySymbols[selectedCurrency]}0.00`,
            total_disbursements: `${currencySymbols[selectedCurrency]}0.00`,
            transactions: [],
            settlements: [],
          }));

          // display error message
          notifyError("No accounts found. Please contact support.");
          return;
        }

        const main_account_balance = merchantBalance?.accounts?.find(
          (account: any) => account.account_type === "main"
        ) || {};
        const rolling_reserve_account_balance = merchantBalance?.accounts?.find(
          (account: any) => account.account_type === "reserve"
        ) || {};

        if (main_account_balance?.id) {
          const accountInfo = {
            main_account_id: main_account_balance.id,
            ...(rolling_reserve_account_balance?.id && {
              rolling_reserve_account_id: rolling_reserve_account_balance.id
            })
          };

          const { setAccounts } = useCurrency.getState();
          setAccounts(selectedCurrency, accountInfo);
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          wallet_id: main_account_balance?.account_number || null,
          available_balance: formatBalance(main_account_balance.available_balance, selectedCurrency),
          ledger_balance: formatBalance(main_account_balance.actual_balance, selectedCurrency),
          locked_balance: formatBalance(main_account_balance.locked_balance, selectedCurrency),
          settlement_balance: formatBalance(settlement_balance, selectedCurrency),
          transactions,
          settlements,
          rolling_reserve: formatBalance(rolling_reserve_account_balance?.available_balance, selectedCurrency),
          rolling_reserve_ledger: formatBalance(rolling_reserve_account_balance?.actual_balance, selectedCurrency),
          total_collections: total_collections || `${currencySymbols[selectedCurrency]}0.00`, // fallback to 0 if undefined
          total_disbursements: total_disbursements || `${currencySymbols[selectedCurrency]}0.00`,
        }));
      },
      onError: (error) => {
        console.error('❌ Failed to fetch dashboard data:', error);
      }
    }
  );

  const { loading: isChartLoading } = useEffectFetch(
    async () => {
      return await populateCharts(selectedOption, selectedCurrency);
    },
    [selectedOption, selectedCurrency, mounted],
    {
      enabled: !!(selectedOption && mounted && selectedCurrency),
      onSuccess: (response) => {
        setState(prev => ({
          ...prev,
          transactions: response,
          refreshChart: false
        }));
      },
      onError: (error) => {
        console.error('❌ Failed to fetch chart data:', error);
        setState(prev => ({ ...prev, refreshChart: false }));
      }
    }
  );

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setSelectedOption(value);
    setState(prev => ({ ...prev, refreshChart: true }));
  };

  const handleRefresh = (e: React.MouseEvent<HTMLSpanElement> | undefined) => {
    e?.stopPropagation();
    setRotation(rotation + 360);
  };

  const secondOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last One Month" },
    { value: "366", label: "Last One Year" },
  ];

  const lineChartProps = {
    secondOptions,
    selectedOption,
    handleChange,
  };
  const labels = state?.transactions?.map((label: any) => label?.month);

  if (!mounted) {
    return (
      <Layout pageTitle='Dashboard' icon='dashboard'>
        <WebPageTitle title='Dashboard | Ramp Merchant Portal' />
        <TableSkeleton />
      </Layout>
    );
  }

  return (
    <Layout pageTitle='Dashboard' icon='dashboard'>
      <WebPageTitle title='Dashboard | Ramp Merchant Portal' />

      <div className="flex flex-row md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-sm text-[#7F7F7F] dark:text-[#EFF7FE90]">
            Good Morning, <span className="text-black dark:text-white tracking-wider">{capitalizeFirstLetter(firstname)}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <Icon name="edit2" className="inline-block" />

            <Link href="/settings" className="text-left text-xs font-semibold text-[#005BB0]">
              Manage account
            </Link>
          </div>
        </div>

        <div className="w-28">
          <CurrencySwitcher currencies={['all']} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-y-10 mt-8">
        <div className="md:col-span-2 relative h-72 md:h-56">
          <div className="flex flex-col justify-between relative bg-[#090727] text-white h-full rounded-[10px] px-4 md:px-8 py-3.5 md:py-7 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold">Toggle Balance</span>
                <Switch id="balance" enabled={showBalance} onChange={handleToggle} />
              </div>

              <span>
                {getCurrencyFlag()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs md:text-sm font-semibold text-[#7F7F7F]">
                  Wallet ID:
                </p>
                <p className="flex items-center gap-4 md:text-lg font-bold text-[#EFF7FE] mt-0.5">
                  <span>{state.wallet_id}</span>

                  {state?.wallet_id ? (
                    <Icon
                      name="copy2"
                      className="inline-block size-4 cursor-pointer"
                      onClick={() => copyToClipboard(state.wallet_id || "")}
                    />
                  ) : null}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-[#7F7F7F]">
                  Available Balance:
                </p>
                <p className="flex items-center gap-4 md:text-lg font-bold text-[#EFF7FE] mt-0.5">
                  {showBalance ? (
                    <span>
                      <span className="text-[#7F7F7F] mr-0.5">
                        {state.available_balance.charAt(0)}
                      </span>
                      {state.available_balance.slice(1)}

                    </span>
                  ) : (
                    <span className="text-[#7F7F7F]">******</span>
                  )}

                  <Icon
                    name="refresh2"
                    className="inline-block size-4 cursor-pointer transition-transform duration-500 ease-in-out"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onClick={handleRefresh}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-[#7F7F7F]">
                  Ledger Balance:
                </p>
                <p className="md:text-lg font-bold text-[#EFF7FE] mt-0.5">
                  {showBalance ? (
                    <>
                      <span className="text-[#7F7F7F] mr-0.5">
                        {state.ledger_balance.charAt(0)}
                      </span>
                      {state.ledger_balance.slice(1)}
                    </>
                  ) : (
                    <span className="text-[#7F7F7F]">******</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-[#7F7F7F]">
                  Locked Balance:
                </p>
                <p className="md:text-lg font-bold text-[#EFF7FE] mt-0.5">
                  {showBalance ? (
                    <>
                      <span className="text-[#7F7F7F] mr-0.5">
                        {state.locked_balance.charAt(0)}
                      </span>
                      {state.locked_balance.slice(1)}
                    </>
                  ) : (
                    <span className="text-[#7F7F7F]">******</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute w-[-webkit-fill-available] bg-[#005BB0] h-56 mx-10 top-2.5 rounded-[10px]">&nbsp;</div>
        </div>

        <div className="rounded-[10px] border border-[#C4C4C452] pl-6 pb-6 h-56 flex flex-col justify-end gap-8">
          <div className="bg-[#FD27271A] text-[#FD2727] size-12 rounded-[10px] flex items-center justify-center">
            <Icon name="arrow2" />
          </div>

          <div>
            <p className="break-keep w-28 text-sm text-[#7F7F7F] dark:text-[#EFF7FE] font-semibold">
              Total Disbursements:
            </p>
            <p className="text-lg font-bold text-[#090727] dark:text-[#EFF7FE90] mt-2">
              <span className="text-[#7F7F7F] mr-1">
                {state.total_disbursements.charAt(0)}
              </span>
              {state.total_disbursements.slice(1)}
            </p>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#C4C4C452] pl-6 pb-6 h-56 flex flex-col justify-end gap-8">
          <div className="bg-[#2BD3251A] text-[#2BD325] size-12 rounded-[10px] flex items-center justify-center">
            <Icon name="arrow2" className="rotate-180" />
          </div>

          <div>
            <p className="break-keep w-28 text-sm text-[#7F7F7F] dark:text-[#EFF7FE] font-semibold">
              Total Collections:
            </p>
            <p className="text-lg font-bold text-[#090727] dark:text-[#EFF7FE90] mt-2">
              <span className="text-[#7F7F7F] mr-1">
                {state.total_collections.charAt(0)}
              </span>
              {state.total_collections.slice(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden mt-6 md:grid md:grid-cols-1 xl:grid-cols-5 gap-4 w-full p-6">
        <div className="md:col-span-2 border border-[#C4C4C452] rounded-2xl overflow-hidden">
          <BarChart
            settlementBalance={state.settlement_balance}
            settlements={state.settlements}
            isLoading={isDashboardLoading}
            showBalance={showBalance}
          />
        </div>

        <div className="xl:col-span-3 border border-[#C4C4C452] rounded-2xl overflow-hidden">
          <LineChart
            labels={labels}
            chartData={state.transactions}
            lineChartProps={lineChartProps}
            isLoading={isDashboardLoading || isChartLoading}
            isChartRefresh={state.refreshChart}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
