import { useState } from "react";
import { useStore } from "../store";
import type { Workspace } from "../types";
import { getUserWorkspaceRole, isWorkspaceOwner } from "../utils/permissions";

interface WorkspaceBrowserProps {
  onClose: () => void;
  onSelectWorkspace: (workspace: Workspace) => void;
}

export default function WorkspaceBrowser({
  onClose,
  onSelectWorkspace,
}: WorkspaceBrowserProps) {
  const { user, workspaces, currentWorkspace, workspaceMembers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "owned" | "member">("all");

  const filteredWorkspaces = workspaces.filter((workspace) => {
    // Search filter
    const matchesSearch =
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const isOwner = workspace.ownerId === user?.id;
    const matchesFilter =
      filterBy === "all" ||
      (filterBy === "owned" && isOwner) ||
      (filterBy === "member" && !isOwner);

    return matchesSearch && matchesFilter;
  });

  const getWorkspaceStats = (workspace: Workspace) => {
    const members = workspaceMembers.filter(
      (m) => m.workspaceId === workspace.id
    );
    const userRole =
      user && workspace
        ? getUserWorkspaceRole(user.id, workspace.id, workspaceMembers)
        : "participant";
    const isOwned = isWorkspaceOwner(user, workspace);

    return { memberCount: members.length, userRole, isOwned };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Workspaces
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse and switch between your teams
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="input-field pl-10"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterBy === "all"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterBy("owned")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterBy === "owned"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                👑 Owned
              </button>
              <button
                onClick={() => setFilterBy("member")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterBy === "member"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Member
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredWorkspaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500">
                {searchQuery
                  ? "No workspaces found matching your search"
                  : "No workspaces found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((workspace) => {
                const { memberCount, userRole, isOwned } =
                  getWorkspaceStats(workspace);
                const isCurrent = currentWorkspace?.id === workspace.id;

                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      onSelectWorkspace(workspace);
                      onClose();
                    }}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left hover:shadow-lg hover:scale-105 ${
                      isCurrent
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-gray-200 bg-white hover:border-primary/50"
                    }`}
                  >
                    {/* Current Badge */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                          Current
                        </span>
                      </div>
                    )}

                    {/* Workspace Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-xl">
                        {workspace.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Workspace Name */}
                    <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                      {workspace.name}
                      {isOwned && <span className="text-base">👑</span>}
                    </h3>

                    {/* Description */}
                    {workspace.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {workspace.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span>{memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="capitalize">{userRole}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            💡 Tip: Create multiple workspaces to organize different teams or
            projects
          </p>
        </div>
      </div>
    </div>
  );
}
