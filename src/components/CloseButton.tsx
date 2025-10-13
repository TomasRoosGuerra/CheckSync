interface CloseButtonProps {
  onClose: () => void;
  className?: string;
}

export default function CloseButton({ onClose, className = "" }: CloseButtonProps) {
  return (
    <button
      onClick={onClose}
      className={`w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ${className}`}
      title="Close"
    >
      ✕
    </button>
  );
}
