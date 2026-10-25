import { RoomDuration } from '@/lib/interfaces';
import { type DropdownItem } from '@/ui/dropdown';

export const ROOM_DURATION_OPTIONS: DropdownItem<RoomDuration>[] = [
  {
    value: RoomDuration.HALF_HOUR,
    label: '30 minutes',
  },
  {
    value: RoomDuration.ONE_HOUR,
    label: '1 hour',
  },
  {
    value: RoomDuration.THREE_HOURS,
    label: '3 hours',
  },
];