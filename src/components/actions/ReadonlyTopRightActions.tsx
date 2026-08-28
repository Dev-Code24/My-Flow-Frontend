import EditSharedFlowButton from './EditSharedFlowButton';
import { AuthAction } from "../auth";

interface ReadonlyTopRightActionProps {
  onEdit: () => void;
}

export default function ReadonlyTopRightAction({
  onEdit,
}: ReadonlyTopRightActionProps) {
  return (
    <div className='flex items-center gap-2'>
      <EditSharedFlowButton onClick={onEdit} />
      <AuthAction />
    </div>
  );
}