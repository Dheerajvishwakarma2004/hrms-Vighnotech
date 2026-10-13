import { PencilLine, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Current task for the day (clamped to two lines) with a shortcut to edit it.
 * @param {{ task?: string }|null} attendance
 * @param {() => void} onEdit
 */
export default function AttendanceTaskCell({ attendance, onEdit }) {
  const task = attendance?.task?.trim();

  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      {task ? (
        <p
          title={task}
          className="line-clamp-2 whitespace-pre-line break-words text-sm text-slate-700"
        >
          {task}
        </p>
      ) : (
        <p className="text-sm italic text-slate-400">No task yet</p>
      )}
      <Button
        variant="soft"
        size="sm"
        icon={task ? PencilLine : Plus}
        onClick={onEdit}
      >
        {task ? "Update task" : "Add task"}
      </Button>
    </div>
  );
}
