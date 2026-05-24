'use client'

import { Tool } from '@/interfaces';
import { MousePointer2, Square, Diamond, Circle } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface ShapesNavbarProps {
   tool: Tool;
   setTool: Dispatch<SetStateAction<Tool>>;
   setSelectedId: Dispatch<SetStateAction<number[]>>;
}

export default function ShapesNavbar(props: ShapesNavbarProps) {
   const { tool, setTool, setSelectedId } = props;
   return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 pointer-events-auto">
      
      {/* Selection Tool */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={() => setTool(Tool.SELECT)}
          className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            tool === Tool.SELECT 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <MousePointer2 size={20} />
        </button>
        {/* Shortcut Hint */}
        <span className="absolute -bottom-8 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Select <span className="text-slate-400 ml-1">V</span>
        </span>
      </div>

      <div className="w-px h-8 bg-slate-200 mx-2" />

      {/* Rectangle Tool */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={() => { 
            setSelectedId([]);
            setTool(Tool.DRAW_RECTANGLE); 
          }}
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            tool === Tool.DRAW_RECTANGLE 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Square size={20} />
        </button>
        <span className="absolute -bottom-8 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Rectangle <span className="text-slate-400 ml-1">D</span>
        </span>
      </div>
      
      <div className="w-px h-8 bg-slate-200 mx-2" />

      {/* Rhombus Tool */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={() => { 
            setSelectedId([]);
            setTool(Tool.DRAW_RHOMBUS); 
          }}
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            tool === Tool.DRAW_RHOMBUS 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Diamond size={20} />
        </button>
        <span className="absolute -bottom-8 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Rhombus <span className="text-slate-400 ml-1">R</span>
        </span>
      </div>
      <div className="group relative flex flex-col items-center">
        <button
          onClick={() => { 
            setSelectedId([]);
            setTool(Tool.DRAW_OVAL); 
          }}
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            tool === Tool.DRAW_OVAL 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Circle size={20} />
        </button>
        <span className="absolute -bottom-8 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Oval <span className="text-slate-400 ml-1">R</span>
        </span>
      </div>
    </div>
   );
}