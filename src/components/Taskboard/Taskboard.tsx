import { useTaskBoardStore } from "../../store/taskBoardStore";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { Status } from "../../types/board.types";
import BoardColumn from "./BoardColumn";

const Taskboard = () => {
  const selectedRepo = useSelectedRepoStore((s) => s.repo);

  // TODO: Add a warning modal/callout for displaying errors (decision model approach using enums to resolve messages for a common callout component?)
  const items = useTaskBoardStore((s) =>
    selectedRepo ? s.getItems(selectedRepo.path) : [],
  );
  if (!selectedRepo) return null;

  const backlogItems = items.filter((i) => i.status === Status.Backlog);
  const inProgressItems = items.filter((i) => i.status === Status.InProgress);
  const doneItems = items.filter((i) => i.status === Status.Done);

  return (
    <section className="flex w-full flex-col gap-4 rounded-lg bg-gray-900 p-4 text-white">
      <section className="flex items-center justify-between">
        <h1>Tasks</h1>
        <button className="rounded-lg border-2 border-gray-700 bg-green-600 p-2 transition-all duration-300 hover:bg-green-700">
          Add Item
        </button>
      </section>

      <section className="flex min-h-32 w-full justify-between gap-2">
        <BoardColumn columnStatus={Status.Backlog} workItems={backlogItems} />
        <BoardColumn
          columnStatus={Status.InProgress}
          workItems={inProgressItems}
        />
        <BoardColumn columnStatus={Status.Done} workItems={doneItems} />
      </section>
    </section>
  );
};

export default Taskboard;
