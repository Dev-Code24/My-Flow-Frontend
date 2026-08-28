import { ShareModal } from '@/components';
import { AuthAction } from '../auth';
import { RoomCollaborationOptions } from "@/interfaces";

interface EditableTopRightActionProps {
  onStartSession: (options: RoomCollaborationOptions) => Promise<void>;
  onExportToLink: () => Promise<void>;
  isStartingSession: boolean;
  isAuthenticated: boolean;
  isExporting: boolean;
}

export default function EditableTopRightAction({
  onStartSession,
  onExportToLink,
  isAuthenticated,
  isStartingSession,
  isExporting,
}: EditableTopRightActionProps) {
  return (
    <div className='flex items-center gap-5'>
      <ShareModal
        onStartSession={onStartSession}
        onExportToLink={onExportToLink}
        isAuthenticated={isAuthenticated}
        isStartingSession={isStartingSession}
        isExporting={isExporting}
      />
      <AuthAction />
    </div>
  );
}