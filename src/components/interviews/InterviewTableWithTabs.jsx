import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { cn } from "@/utils/cls";
import InterviewTable from "../../pages/admin/interviews/component/InterviewTable";
import { useEffect, useMemo, useState } from "react";
import InterviewStages, {
  InterviewStageByLvl,
} from "../../constant/interview-stages";
import { useSearchParams } from "react-router-dom";

export default function InterviewTableWithTabs({
  loading = false,
  pageState,
  groupedByRound = {},
  InterviewTableProps = {},
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roundFromQuery = searchParams.get("round");

  const roundsWithData = Object.keys(groupedByRound);
  const stageOrderMap = useMemo(
    () =>
      InterviewStages.reduce((acc, stage, index) => {
        acc[stage.toLowerCase()] = index;
        return acc;
      }, {}),
    [],
  );

  const sortedRounds = useMemo(
    () =>
      [...roundsWithData].sort((a, b) => {
        const aOrder = stageOrderMap[a.toLowerCase()];
        const bOrder = stageOrderMap[b.toLowerCase()];

        const isAUnknown = aOrder === undefined;
        const isBUnknown = bOrder === undefined;

        if (isAUnknown && isBUnknown) {
          return a.localeCompare(b);
        }
        if (isAUnknown) {
          return 1;
        }
        if (isBUnknown) {
          return -1;
        }
        return aOrder - bOrder;
      }),
    [roundsWithData, stageOrderMap],
  );

  const initialTabIndex = sortedRounds.findIndex(
    (stage) => stage.toLowerCase() === roundFromQuery?.toLowerCase(),
  );

  const [activeTab, setActiveTab] = useState(
    initialTabIndex !== -1 ? initialTabIndex : 0,
  );

  useEffect(() => {
    setActiveTab(initialTabIndex !== -1 ? initialTabIndex : 0);
  }, [initialTabIndex]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">loading...</div>;
  }

  if (!loading && roundsWithData.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No interviews found.
      </div>
    );
  }

  function handleTabChange(index) {
    setActiveTab(index);
    const selectedRound = sortedRounds[index];
    if (selectedRound) {
      setSearchParams({ round: selectedRound.toLowerCase() });
    } else {
      setSearchParams({});
    }
  }

  function isToday(checkDate) {
    const d = new Date().toDateString();
    const utc = checkDate.toDateString();
    const res = utc == d;
    return res;
  }

  return (
    sortedRounds.length > 0 && (
      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <TabList className="flex border-b mb-4">
          {sortedRounds.map((round, idx) => {
            const isVaild = roundsWithData.includes(round);
            if (!isVaild) return null;
            const data = groupedByRound[round];
            let todayInterviewCounts = data?.length;
            if (
              round === InterviewStageByLvl.FIRSTROUND ||
              round === InterviewStageByLvl.SECONDROUND
            ) {
              todayInterviewCounts = data?.filter((item) =>
                isToday(new Date(item?.interviewDateTime)),
              )?.length;
            }
            return (
              <Tab
                key={`${round}-${idx}`}
                className={({ selected }) =>
                  cn(
                    "py-2 px-4 flex items-center gap-2",
                    selected
                      ? "border-b-2 bg-blue-500/10 border-blue-500 text-blue-500"
                      : "text-gray-500 hover:text-gray-700 hover:bg-blue-500/5",
                  )
                }
              >
                {round.toUpperCase()}{" "}
                <span className=" text-xs inline-flex items-center justify-center bg-gray-200 rounded-full p-1 h-5 w-5">
                  {todayInterviewCounts || 0}
                </span>
              </Tab>
            );
          })}
        </TabList>
        <TabPanels>
          {sortedRounds.map((round, idx) => {
            const data = groupedByRound[round];
            if (!data || data.length === 0) return null;
            const pageIndex = pageState[round]?.pageIndex || 0;
            const pageSize = pageState[round]?.pageSize || 10;
            return (
              <TabPanel key={round} className="p-0">
                {activeTab !== idx ? null : (
                  <div className="mb-10">
                    <InterviewTable
                      key={`${round}-${idx}-${idx}`}
                      round={round}
                      interviews={data}
                      pageIndex={pageIndex}
                      pageSize={pageSize}
                      {...InterviewTableProps}
                    />
                  </div>
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </TabGroup>
    )
  );
}
