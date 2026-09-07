import { create } from "zustand";
import { WorkItem } from "../types/board.types";
import { persist } from "zustand/middleware";

type TaskBoardStore = {
  boards: Record<string, WorkItem[]>;
  addItem: (repoPath: string, item: WorkItem) => void;
  updateItem: (
    repoPath: string,
    id: string,
    updates: Partial<WorkItem>,
  ) => void;
  deleteItem: (repoPath: string, id: string) => void;
  getItems: (repoPath: string) => WorkItem[];
};

const EMPTY_ITEMS: WorkItem[] = []; // Constant to represent empty list of items. Using a constant to avoid creating a new empty array every time getItems is called for a repoPath that doesn't exist which results in an infinite loop.

/**
 * Store for managing work items (tasks, stories, bugs) associated with different repositories.
 * Each repository is identified by its path, and the store maintains a list of work items for each repository.
 * The store provides methods to add, update, delete, and retrieve work items for a specific repository.
 * DEV NOTE: Using as many comments as I can since this is my first time using Zustand and I want to make sure I understand and document the code well.
 */
export const useTaskBoardStore = create<TaskBoardStore>()(
  persist(
    (set, get) => ({
      boards: {},

      addItem: (repoPath, item) => {
        set((state) => ({
          boards: {
            ...state.boards, // Spread the existing boards
            [repoPath]: [...(state.boards[repoPath] ?? []), item], // Add the new item to the specific repoPath
          },
        }));
      },

      updateItem: (repoPath, id, updates) => {
        set((state) => ({
          boards: {
            ...state.boards, // Spread the existing boards
            [repoPath]: (state.boards[repoPath] ?? []).map(
              (i) =>
                // Map over the items in the specific repoPath
                i.id === id ? { ...i, ...updates } : i, // Update the item if the id matches, otherwise keep it unchanged
            ),
          },
        }));
      },

      deleteItem: (repoPath, id) => {
        set((state) => ({
          boards: {
            ...state.boards, // Spread the existing boards
            [repoPath]: (state.boards[repoPath] ?? []).filter(
              (i) => i.id !== id,
            ), // Filter out the item with the specified id
          },
        }));
      },

      getItems: (repoPath) => get().boards[repoPath] ?? EMPTY_ITEMS,
    }),
    // TODO: Will be migrated to a database in the future, but for now, we can use localStorage to persist the state across page reloads.
    { name: "gitgrove-board" }, // Name of the storage key for persisting the state in localStorage
  ),
);
