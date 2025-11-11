"use client";

import { forwardRef } from "react";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className = "", value, onChange, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      // Open the picker when clicking anywhere on the input
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      }
    };

    return (
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={onChange}
        onClick={handleClick}
        className={`input cursor-pointer ${className}`}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;

