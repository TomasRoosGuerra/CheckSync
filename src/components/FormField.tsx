import { type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export default function FormField({
  label,
  children,
  error,
  helpText,
  required = false,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
