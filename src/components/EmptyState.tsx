import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {/* Decorative icon circle */}
      <div className="w-20 h-20 rounded-full bg-primary-fixed/40 flex items-center justify-center mb-5 shadow-sm">
        <Icon size={36} className="text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all active:scale-[0.96] shadow-sm"
        >
          {action}
        </button>
      )}
    </div>
  );
}
