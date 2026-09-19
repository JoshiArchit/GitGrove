import { openUrl } from "@tauri-apps/plugin-opener";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import {
  ChevronDown,
  GitBranch,
  GitCommitHorizontal,
  Info,
  Link,
  Sunrise,
  Sunset,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import StatCard from "./StatCard";

const RepoSummary = () => {
  const repoSummary = useSelectedRepoStore((s) => s.summary);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Sets up the graph and disposes on unmount
  useEffect(() => {
    if (!chartDivRef.current) return;
    // No fixed width — the container is styled to stretch full-width, so the
    // canvas should measure it instead of being pinned to a literal pixel size.
    chartRef.current = echarts.init(chartDivRef.current, undefined, {
      height: 120,
    });

    // init() only measures the container once. Without this, the canvas
    // stays at its initial width even if the container later resizes (e.g.
    // the sidebar collapsing/expanding, or the window resizing).
    const resizeObserver = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    resizeObserver.observe(chartDivRef.current);

    return () => {
      resizeObserver.disconnect();
      chartRef.current?.dispose();
    };
  }, []);

  // Render the chart on any changes in data
  useEffect(() => {
    if (!chartRef.current || !repoSummary) return;

    // Get Top 6 languages
    const languages = Object.entries(repoSummary.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
    const total = languages.reduce((sum, [, value]) => sum + value, 0);
    const barRadius = 12;

    const options: EChartsOption = {
      legend: {
        orient: "horizontal",
        right: 0,
        top: "bottom",
        textStyle: { color: "#ffffff" },
        data: languages.map(([name]) => name),
      },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const percent = total ? ((params.value / total) * 100).toFixed(1) : 0;
          return `${params.seriesName}<br/>${params.value} lines (${percent}%)`;
        },
      },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: "value",
        show: false,
        // Without an explicit max, the value axis auto-scales to a "nice"
        // round number above the data — leaving a gap between the end of the
        // stacked bar and the edge of the chart. Pinning it to the exact
        // stacked total makes the bar fill the full width.
        min: 0,
        max: total,
      },
      yAxis: {
        type: "category",
        show: false,
        data: ["Languages"],
      },
      // One series per language, all stacked onto the same category — that's
      // what turns a normal horizontal bar chart into a single segmented bar:
      // each series contributes one proportional slice of the same row.
      series: languages.map(([name, value], index) => {
        const isFirst = index === 0;
        const isLast = index === languages.length - 1;
        // Round only the outer caps of the whole bar (the first segment's
        // left edge, the last segment's right edge) — inner segment
        // boundaries stay square, giving a single pill shape rather than
        // every segment looking individually rounded.
        return {
          name,
          type: "bar",
          stack: "distribution",
          barWidth: "20%",
          data: [value],
          itemStyle: {
            borderRadius: [
              isFirst ? barRadius : 0,
              isLast ? barRadius : 0,
              isLast ? barRadius : 0,
              isFirst ? barRadius : 0,
            ],
          },
          emphasis: {
            focus: "series",
          },
        };
      }),
    };

    chartRef.current.setOption(options);
  }, [repoSummary]);

  return (
    <div
      id="repo-summary"
      className={`${collapsed ? "gap-0" : "gap-4"} box-border flex h-fit w-full flex-col rounded-xl bg-gray-900 p-4 text-white transition-[gap] duration-300`}
    >
      <button
        className="flex w-fit items-center gap-2 border-0 bg-transparent p-0 text-white"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>Repository Summary</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : "auto" }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden bg-transparent"
      >
        <div className="flex flex-col gap-3">
          <section
            id="languages-chart"
            className="shadow-card-elevation-1 flex w-full flex-col rounded-xl bg-gray-800 p-4"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-white">Tech Stack</span>
              <Info className="h-4 w-4 self-start text-gray-500" />
            </div>
            <div className="flex w-full" ref={chartDivRef}></div>
          </section>
          <section
            id="summary-stats"
            className="shadow-card-elevation-1 flex w-full min-w-0 flex-col rounded-xl bg-gray-800 p-4"
          >
            <section className="flex h-fit w-full min-w-0 flex-col flex-wrap items-start justify-center gap-3 border-b-2 border-gray-900 pb-4">
              <span
                className="w-full truncate"
                title={repoSummary?.current_branch}
              >
                Current Branch : {repoSummary?.current_branch}
              </span>
              {repoSummary?.remote_url ? (
                <button
                  className="flex w-full min-w-0 items-start gap-1 border-0 bg-transparent p-0 text-white"
                  onClick={() => openUrl(repoSummary.remote_url!)}
                  title={repoSummary.remote_url}
                >
                  <span className="w-fit shrink-0">Remote : </span>
                  <span className="min-w-0 truncate hover:cursor-pointer hover:underline">
                    {repoSummary.remote_url}
                  </span>
                  <Link className="h-3 w-3 shrink-0" />
                </button>
              ) : (
                <span>Remote : No remote set</span>
              )}
            </section>

            <section className="box-border grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 p-4">
              <StatCard
                icon={<GitBranch className="h-4 w-4" />}
                title="Branches"
                value={repoSummary?.branches.length ?? 0}
              />

              <StatCard
                icon={<GitCommitHorizontal />}
                title="Commits"
                value={repoSummary?.total_commits ?? 0}
              />

              <StatCard
                icon={<Sunrise />}
                title="First Commit"
                value={repoSummary?.first_commit_date ?? 0}
              />

              <StatCard
                icon={<Sunset />}
                title="Most Recent Commit"
                value={repoSummary?.last_commit_date ?? 0}
              />
            </section>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default RepoSummary;
