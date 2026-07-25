import { invoke } from "@tauri-apps/api/core";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";
import { Contributions, RepoEntry } from "../types/repo.types";

type ContributionGraphProps = {
  selectedRepo: RepoEntry | undefined;
};

function buildCalendarData(contributions: Contributions): [string, number][] {
  return Object.entries(contributions.contributions).map(([date, byAuthor]) => {
    const total = Object.values(byAuthor.by_author).reduce(
      (sum, count) => sum + count,
      0,
    );
    return [date, total];
  });
}

const ContributionGraph = ({ selectedRepo }: ContributionGraphProps) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [contributions, setContributions] = useState<Contributions | null>(
    null,
  );

  // Gets the contributions for the selected repository
  useEffect(() => {
    if (!selectedRepo) return;

    async function getContributions() {
      const result = await invoke<Contributions>("get_contributions", {
        repoPath: selectedRepo?.path,
      });
      setContributions(result);
    }

    getContributions();
  }, [selectedRepo?.path]);

  // Sets up the graph and disposes on unmount
  useEffect(() => {
    if (!graphRef.current) return;
    chartRef.current = echarts.init(graphRef.current, undefined, {
      width: 780,
      height: 140,
    });
    return () => {
      chartRef.current?.dispose();
    };
  }, []);

  // Update graph on any changes in contributions
  useEffect(() => {
    if (!chartRef.current || !contributions) return;

    const data = buildCalendarData(contributions);
    const maxCount = Math.max(1, ...data.map(([, count]) => count));

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const options: EChartsOption = {
      tooltip: {
        confine: true,
        appendTo: () => document.body,
        formatter: (params: any) => {
          const date: string = params.value[0];
          const byAuthor = contributions.contributions[date]?.by_author ?? {};
          const lines = Object.entries(byAuthor)
            .map(([email, count]) => `${email}: ${count}`)
            .join("<br/>");
          return `${date}<br/>${lines || "No commits"}`;
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        type: "piecewise",
        orient: "horizontal",
        right: 30, // matches calendar.right below — aligns "More" with the graph's right edge
        bottom: 0,
        itemGap: 4, // tighter spacing between the Less/More swatches (was using ECharts' default ~10)
        textStyle: { color: "#fff" },
        showLabel: false,
        text: ["More", "Less"],
        inRange: {
          color: ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"],
        },
      },
      calendar: {
        top: 20,
        left: 50,
        right: 30,
        cellSize: [11, 11], // fixed square cells (was ["auto", 13] — auto-width was computing wider than tall)
        range: [
          oneYearAgo.toISOString().slice(0, 10),
          today.toISOString().slice(0, 10),
        ],
        itemStyle: {
          color: "#030712",
          borderWidth: 0.5,
          borderColor: "#111827",
        },
        yearLabel: { show: false },
        dayLabel: {
          nameMap: ["", "Mon", "", "Wed", "", "Fri", ""],
        },
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data,
      },
    };

    chartRef.current.setOption(options);
  }, [contributions]);

  return (
    <aside
      id="contributions-graph"
      className="flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-lg bg-gray-900 p-4"
    >
      <span className="text-white">Contribution Graph</span>
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden">
        <div ref={graphRef} className="mx-auto h-36 w-195 shrink-0" />
      </div>
    </aside>
  );
};

export default ContributionGraph;
