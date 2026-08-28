'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface TextInputProps {
  label: string;
  name: string;
  placeholder?: string;
  style?: React.CSSProperties;
  type?: 'text' | 'password';
}

const TextInput: React.FC<TextInputProps> = ({ label, name, placeholder = '', style, type = 'text' }) => {
  const { register, watch } = useFormContext();
  const [focused, setFocused] = useState(false);
  const fieldId = label.toLowerCase().split(' ').join('-');

  const val = watch(name);

  // important for removing autofill bg-color
  const inputStyle = {
    WebkitBoxShadow: '0 0 0px 1000px white inset !important',
    boxShadow: '0 0 0px 1000px white inset !important',
    WebkitTextFillColor: '#000 !important',
    transition: 'background-color 5000s ease-in-out 0s',
  };

  return (
    <div
      className='relative'
      style={{
        ...style,
      }}
    >
      <label
        htmlFor={fieldId}
        className={`absolute left-3 ${
          focused || val ? '-top-2 text-sm text-blue-800' : 'top-3 text-gray-500 text-base'
        } transition-all duration-250 bg-white px-1 cursor-text`}
      >
        {label}
      </label>
      <input
        id={fieldId}
        style={{ ...inputStyle }}
        {...register(name)}
        type={type}
        placeholder={focused ? placeholder : ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className='w-full p-3 text-base border rounded-xl outline-none border-gray-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-300 transition-all bg-white'
      />
    </div>
  );
};

export default TextInput;