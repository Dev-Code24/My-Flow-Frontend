'use client'

import { Tool, WhiteboardAction } from '@/interfaces';
import { MousePointer2, Square, Diamond, Circle, LockKeyholeOpen, Hand, Shapes, ArrowUpRight } from 'lucide-react';
import React, { Dispatch, SetStateAction, useState } from 'react';

interface ShapesNavbarProps {
  tool: Tool;
  dispatchWhiteBoardState: React.ActionDispatch<[action: WhiteboardAction]>
  setIsSpacePressed: Dispatch<SetStateAction<boolean>>;
}

const TOOLS = [
  { id: Tool.SELECT,         Icon: MousePointer2, label: 'Select',    shortcut: '1' },
  { id: Tool.DRAW_RECTANGLE, Icon: Square,        label: 'Rectangle', shortcut: '2' },
  { id: Tool.DRAW_RHOMBUS,   Icon: Diamond,       label: 'Rhombus',   shortcut: '3' },
  { id: Tool.DRAW_OVAL,      Icon: Circle,        label: 'Oval',      shortcut: '4' },
  { id: Tool.DRAW_ARROW,     Icon: ArrowUpRight,  label: 'Arrow',     shortcut: '5' },
] as const;

export default function ShapesNavbar({ tool, dispatchWhiteBoardState, setIsSpacePressed }: ShapesNavbarProps) {
  const [locked, setLocked] = useState(false);

  const pick = (next: Tool) => {
    setIsSpacePressed(false);
    dispatchWhiteBoardState({ type: 'CHANGE_TOOL', tool: next });
  };

  return (
    <div className='absolute top-5.5 left-1/2 -translate-x-1/2 z-10'>
      <div className='flex items-center gap-0.5 px-3 py-2 rounded-[22px] bg-white border border-[#EBEAF0] shadow-[0_12px_32px_-10px_rgba(20,20,40,0.18),0_2px_6px_rgba(20,20,40,0.05)]'>

        <ToolButton active={locked} onClick={() => setLocked(v => !v)}
          label={locked ? 'Unlock canvas' : 'Lock canvas'} Icon={LockKeyholeOpen} />

        <Divider />

        <ToolButton
          active={tool === Tool.PAN}
          onClick={() => pick(Tool.PAN)}
          label='Hand (pan)'
          Icon={Hand} 
        />

        {TOOLS.map(t => (
          <ToolButton
            key={t.id}
            active={tool === t.id} 
            onClick={() => pick(t.id as Tool)}
            label={t.label}
            shortcut={t.shortcut}
            Icon={t.Icon}
          />
        ))}

        <Divider />

        {/* Shape library */}
        <ToolButton label='More shapes' onClick={() => {}} Icon={Shapes} />
      </div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className='w-px h-6.5 mx-1.75 bg-border shrink-0' />;
}

function ToolButton({ active, onClick, label, shortcut, Icon }: {
  active?: boolean;
  onClick: () => void;
  label: string;
  shortcut?: string;
  Icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`group relative w-11.5 h-11.5 rounded-[13px] inline-flex items-center justify-center transition-colors duration-150 ${active ? 'bg-surface-selected text-tool-primary' : 'text-tool-default hover:bg-surface-muted'}`}
    >
      <Icon size={21} />
      {shortcut && (
        <span aria-hidden className={`absolute right-1.75 bottom-1.5 text-[11px] leading-none font-medium ${active ? 'text-tool-primary/55' : 'text-text-muted'}`}>
          {shortcut}
        </span>
      )}
    </button>
  );
}