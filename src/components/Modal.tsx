import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  variant?: "center" | "bottom" | "fullscreen";
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  variant = "center",
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const variantClasses = {
    center: "items-center justify-center",
    bottom: "items-end sm:items-center justify-center",
    fullscreen: "items-center justify-center p-0",
  };

  const modalClasses = {
    center: "rounded-2xl",
    bottom: "rounded-t-3xl sm:rounded-2xl",
    fullscreen: "rounded-none",
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex ${
        variantClasses[variant]
      } ${variant !== "fullscreen" ? "p-4" : ""}`}
      onClick={onClose}
    >
      <div
        className={`bg-white ${modalClasses[variant]} shadow-2xl ${
          sizeClasses[size]
        } w-full ${
          variant === "fullscreen" ? "h-full" : "max-h-[90vh] sm:max-h-[90vh]"
        } overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
