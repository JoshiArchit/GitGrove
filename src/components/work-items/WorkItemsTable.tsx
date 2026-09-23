import { resolveWorkItemColor } from "../../resolvers/workItemConfigResolver";
import { useSelectedRepoStore } from "../../stores/selectedRepoStore";
import { useWorkItemBoardStore } from "../../stores/workItemBoardStore";

const WorkItemsTable = () => {
  const repoPath = useSelectedRepoStore((s) => s.repo?.path);
  const items = useWorkItemBoardStore((s) => s.getItems(repoPath ?? ""));

  return (
    <div className="rounded-lg bg-black">
      <table className="w-full table-fixed">
        <thead className="border-b border-b-gray-700 text-sm text-gray-500">
          <tr>
            <th className="w-[5%] border-l-8 border-gray-900 px-4 py-2 text-left font-medium">
              #
            </th>
            <th className="w-[10%] px-4 py-2 text-left font-medium">Type</th>
            <th className="w-[15%] px-4 py-2 text-left font-medium">Status</th>
            <th className="w-[35%] px-4 py-2 text-left font-medium">Title</th>
            <th className="w-[25%] px-4 py-2 text-left font-medium">Branch</th>
            <th className="w-[10%] px-4 py-2 text-left font-medium">Tasks</th>
          </tr>
        </thead>

        {/* TODO: Make it a draggable row to reorder base on priority */}
        <tbody>
          {items.map((item, index) => {
            const borderColor = resolveWorkItemColor(item.type);
            return (
              <tr
                key={item.id}
                className="not-last:border-b not-last:border-b-gray-800"
              >
                <td
                  className={`border-l-8 px-4 py-2 text-left ${borderColor.borderLeft}`}
                >
                  {index + 1}
                </td>
                <td className="px-4 py-2 text-left">{item.type}</td>
                <td className="px-4 py-2 text-left">{item.status}</td>
                <td className="truncate px-4 py-2 text-left" title={item.title}>
                  {item.title}
                </td>
                <td className="truncate px-4 py-2 text-left">
                  {item.branch ?? "no branch"}
                </td>
                <td className="px-4 py-2 text-left">{item.tasks.length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WorkItemsTable;
