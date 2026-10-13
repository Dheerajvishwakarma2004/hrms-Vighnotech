import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { leaveDocumentPath } from "../leavesApi";

/**
 * Icon button that downloads a leave's supporting document. Renders a dash when there is none.
 * @param {{ download: Function, isDownloading: Function }} downloader result of `useDownload()`
 */
export default function LeaveDocumentButton({
  leave,
  downloader,
  size = "sm",
}) {
  if (!leave.document) return <span className="text-sm text-slate-400">—</span>;

  const { filename } = leave.document;
  return (
    <Button
      variant="ghost"
      size={size}
      iconOnly
      icon={Download}
      title={`Download ${filename}`}
      loading={downloader.isDownloading(leave._id)}
      onClick={(event) => {
        event.stopPropagation();
        downloader.download(leaveDocumentPath(leave._id), filename, leave._id);
      }}
    >
      {`Download document ${filename}`}
    </Button>
  );
}
