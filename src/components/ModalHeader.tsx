import CloseButton from "./CloseButton";

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: string;
}

export default function ModalHeader({
  title,
  subtitle,
  onClose,
  icon,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      <CloseButton onClose={onClose} />
    </div>
  );
}
