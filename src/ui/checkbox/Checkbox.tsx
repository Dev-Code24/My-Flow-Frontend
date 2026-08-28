import React from 'react';

interface CheckboxProps {
  children: React.ReactNode;
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ children, label }) => {
  return (
    <div className='checkboxinput-container flex items-center gap-3'>
      <input
        type='checkbox'
        id={label}
        className='w-6 h-6 appearance-none bg-white border-2 border-solid border-[#1e40af] rounded-md cursor-pointer inline-block relative checked:bg-[#1e40af] checked:after:content-[` `] checked:after:absolute checked:after:top-[3px] checked:after:left-[7px] checked:after:w-[6px] checked:after:h-[12px] checked:after:border-solid checked:after:border-white
        checked:after:border-r-2 checked:after:border-t-0 checked:after:border-l-0 checked:after:border-b-2 checked:after:rotate-[45deg] checked:after:trans focus-visible:outline-none focus:outline-[2px solid #1e40af] focus:outline-offset-2'
      />
      <label htmlFor={label} className='text-sm text-gray-700 cursor-pointer'>
        {children}
      </label>
    </div>
  );
};

export default Checkbox;