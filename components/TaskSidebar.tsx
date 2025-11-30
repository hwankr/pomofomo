'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
}

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task | null) => void;
  selectedTaskId: string | null;
}

export default function TaskSidebar({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  selectedTaskId,
}: TaskSidebarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Tasks
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => {
                onSelectTask(null);
                onClose();
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedTaskId === null
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              No Task
            </button>

            {tasks.length > 0 ? (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    onSelectTask(task);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedTaskId === task.id
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {task.title}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tasks for today
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
