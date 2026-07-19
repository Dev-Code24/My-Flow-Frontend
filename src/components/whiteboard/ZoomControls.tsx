interface ZoomControlsProps {
   zoom: number;
   onZoomIn: () => void;
   onZoomOut: () => void;
   onResetZoom: () => void;
 }
 
 export default function ZoomControls({
   zoom,
   onZoomIn,
   onZoomOut,
   onResetZoom,
 }: ZoomControlsProps) {
   return (
     <div
       className='flex items-center rounded-lg border border-border bg-white px-1 py-1 text-sm font-medium text-tool-default shadow-md'
     >
       <button
         type='button'
         onClick={onZoomOut}
         aria-label='Zoom out'
         className='flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-surface-muted'
       >
         -
       </button>
 
       <span className='w-11 select-none text-center'>
         {Math.round(zoom * 100)}%
       </span>
 
       <button
         type='button'
         onClick={onZoomIn}
         aria-label='Zoom in'
         className='flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-surface-muted'
       >
         +
       </button>
 
       <span
         aria-hidden
         className='mx-1 h-5 w-px shrink-0 bg-border'
       />
 
       <button
         type='button'
         onClick={onResetZoom}
         disabled={zoom === 1}
         title='Reset zoom to 100%'
         className='flex h-7 items-center justify-center rounded-md px-2 transition-colors hover:bg-surface-muted disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent'
       >
         Reset
       </button>
     </div>
   );
 }