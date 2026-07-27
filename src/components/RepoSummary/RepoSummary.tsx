import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import {
  GitBranch,
  GitCommitHorizontal,
  Info,
  Link,
  Sunrise,
  Sunset,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RepoEntry, RepoSummaryData } from "../../types/repo.types";
import StatCard from "./StatCard";

type RepoSummaryProps = {
  selectedRepo: RepoEntry;
};

const RepoSummary = ({ selectedRepo }: RepoSummaryProps) => {
  const [repoSummary, setRepoSummary] = useState<RepoSummaryData | undefined>(
    undefined,
  );
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;
    setRepoSummary(undefined);

    async function getRepoSummary() {
      const result = await invoke<RepoSummaryData>("get_repo_summary", {
        repoPath: selectedRepo?.path,
      });
      setRepoSummary(result);
    }

    getRepoSummary();
  }, [selectedRepo]);

  // Sets up the graph and disposes on unmount
  useEffect(() => {
    if (!chartDivRef.current) return;
    chartRef.current = echarts.init(chartDivRef.current, undefined, {
      width: 320,
      height: 240,
    });
    return () => {
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

    const options: EChartsOption = {
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: { color: "#ffffff" },
        data: languages.map(([name]) => name),
      },
      series: [
        {
          type: "pie",
          center: ["35%", "50%"], // shift left so the legend on the right has room
          radius: ["50%", "70%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: "center",
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "20",
              fontWeight: "lighter",
              color: "#ffffff",
              formatter: "{b}\n{d}%", // name on line 1, percentage on line 2
            },
          },
          data: languages.map(([name, value]) => ({ name, value })),
        },
      ],
    };

    chartRef.current.setOption(options);
  }, [repoSummary]);

  return (
    <div
      id="repo-summary"
      className="box-border flex h-fit w-full flex-col gap-4 rounded-xl bg-gray-900 p-4 text-white"
    >
      <div>Repository Summary</div>
      <div className="flex flex-col gap-3 md:flex-row">
        <section
          id="languages-chart"
          className="shadow-card-elevation flex flex-col rounded-xl bg-gray-800 p-4"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-white">Tech Stack</span>
            <Info className="h-4 w-4 self-start text-gray-500" />
          </div>
          <div ref={chartDivRef}></div>
        </section>
        <section
          id="summary-stats"
          className="shadow-card-elevation flex h-full w-full min-w-0 flex-col rounded-xl bg-gray-800 p-4"
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
              value={repoSummary?.branch_count ?? 0}
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
    </div>
  );
};

export default RepoSummary;
