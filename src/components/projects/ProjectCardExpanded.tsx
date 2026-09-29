import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProjectsStore } from "../../stores/projectsStore";
import { useRepoListStore } from "../../stores/repoListStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";
import { Project, ProjectStatus } from "../../types/project.types";
import { RepoEntry } from "../../types/repo.types";

type ProjectCardExpandedProps = {
  project: Project;
  isDirty: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onRequestClose: (e?: React.SyntheticEvent) => void;
  onSaved: () => void;
};

// A repo is offered for linking once a project is past the idea/brainstorming
// stage — that's when a real codebase is expected to exist for it.
const REPO_LINKABLE_STATUSES = [
  ProjectStatus.InDevelopment,
  ProjectStatus.InTest,
  ProjectStatus.Deployed,
];

function mergeRepos(existing: RepoEntry[], incoming: RepoEntry[]): RepoEntry[] {
  const byPath = new Map(existing.map((r) => [r.path, r]));
  for (const repo of incoming) {
    byPath.set(repo.path, repo);
  }
  return Array.from(byPath.values());
}

const ProjectCardExpanded = ({
  project,
  isDirty,
  onDirtyChange,
  onRequestClose,
  onSaved,
}: ProjectCardExpandedProps) => {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const repoList = useRepoListStore((s) => s.repoList);
  const updateRepoListAndRoot = useRepoListStore(
    (s) => s.updateRepoListAndRoot,
  );
  // Select the stable `boards` object itself, not a derived array — building
  // a new array inside the selector (e.g. via .flat()/.filter()) would be a
  // new reference on every call, which Zustand's reference-equality check
  // reads as "changed" every render, causing an infinite re-render loop.
  const boards = useWorkItemBoardStore((s) => s.boards);
  const associatedItems = Object.values(boards)
    .flat()
    .filter((item) => item.project === project.projectId);

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [selectedRepoPath, setSelectedRepoPath] = useState(
    project.repo ?? "",
  );
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const changed =
      title !== project.title ||
      description !== project.description ||
      status !== project.status ||
      selectedRepoPath !== (project.repo ?? "");
    onDirtyChange(changed);
    // onDirtyChange intentionally omitted — it's the parent's setState, stable
    // in practice but re-running this on identity change would be redundant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, status, selectedRepoPath, project]);

  const showRepoSection = REPO_LINKABLE_STATUSES.includes(status);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    updateProject(project.projectId, {
      title,
      description,
      status,
      repo: selectedRepoPath || undefined,
    });

    onDirtyChange(false);
    onSaved();
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this project? This can't be undone.",
    );
    if (!confirmed) return;

    deleteProject(project.projectId);
    onDirtyChange(false);
    onSaved();
  }

  async function rescanForRepos() {
    const path =
      (await open({
        directory: true,
        multiple: false,
        title: "Select root folder",
      })) ?? "";
    if (!path) return;

    const result = await invoke<RepoEntry[]>("scan_repos", {
      rootDirectory: path,
    });
    updateRepoListAndRoot(mergeRepos(repoList, result), path);
  }

  async function addSingleRepo() {
    const path =
      (await open({
        directory: true,
        multiple: false,
        title: "Select repo folder",
      })) ?? "";
    if (!path) return;

    const result = await invoke<RepoEntry | null>("get_repo_from_path", {
      path,
    });
    if (result) {
      updateRepoListAndRoot(mergeRepos(repoList, [result]));
      setSelectedRepoPath(result.path);
    }
  }

  return (
    <div className="shadow-card-elevation-2 flex w-[75vw] flex-col gap-4 overflow-auto border-t-8 border-t-purple-400 bg-gray-900 px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold tracking-widest text-white uppercase">
            Project
          </span>

          <div className="flex items-center justify-end gap-4 text-white">
            <button
              className="btn-primary disabled:btn-disabled"
              type="submit"
              disabled={!isDirty}
            >
              Save
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onRequestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onRequestClose}
              aria-label="Close"
              className="text-gray-300 transition-all duration-300 hover:cursor-pointer hover:text-white"
            >
              <XIcon className="size-8 rounded-lg" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-white">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-max rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 text-white focus-visible:outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {Object.values(ProjectStatus).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input-element"
        />

        <div className="flex flex-col items-start justify-center gap-1">
          {isPreview ? (
            <div className="input-element prose prose-invert max-h-3/4 overflow-auto bg-gray-900">
              <Markdown remarkPlugins={[remarkGfm]}>
                {description || "*Nothing to preview yet*"}
              </Markdown>
            </div>
          ) : (
            <textarea
              name="description"
              placeholder="Add description"
              className="input-element max-h-3/4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          )}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-2 text-sm tracking-tight text-white underline underline-offset-2 transition-all duration-300 hover:scale-110 hover:cursor-pointer"
          >
            {isPreview ? "Show Editor" : "Supports Markdown"}
          </button>
        </div>

        {showRepoSection && (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-500 p-4">
            <label htmlFor="repo" className="text-white">
              Linked Repo
            </label>
            <div className="flex items-center gap-4">
              <select
                id="repo"
                className="w-full rounded-2xl border-2 border-solid border-gray-500 px-4 py-2 text-white focus-visible:outline-none"
                value={selectedRepoPath}
                onChange={(e) => setSelectedRepoPath(e.target.value)}
              >
                <option value="">No repo linked</option>
                {repoList.map((repo) => (
                  <option key={repo.path} value={repo.path}>
                    {repo.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap text-white"
                onClick={rescanForRepos}
              >
                Rescan
              </button>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap text-white"
                onClick={addSingleRepo}
              >
                Add a Repo
              </button>
            </div>
            <span className="text-xs text-gray-400">
              Don't see the repo you're looking for? Rescan a root folder or
              add it directly without leaving this dialog.
            </span>
          </div>
        )}
      </form>

      <hr className="h-0.5 w-full bg-white" />

      <section className="flex flex-col gap-4">
        <span className="font-semibold tracking-widest text-white uppercase">
          Bugs &amp; Stories
        </span>

        <section className="flex max-h-64 flex-col gap-2 overflow-auto rounded-xl border border-gray-500 px-4 py-2">
          {associatedItems.length === 0 && (
            <span className="text-gray-400">
              No bugs or stories tagged to this project yet
            </span>
          )}
          {associatedItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-lg border border-gray-700 px-3 py-2 text-white"
            >
              <span className="text-xs text-gray-500 uppercase">
                {item.type}
              </span>
              <span>{item.title}</span>
            </div>
          ))}
        </section>
      </section>
    </div>
  );
};

export default ProjectCardExpanded;
