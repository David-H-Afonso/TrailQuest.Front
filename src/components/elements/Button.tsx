import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: string;
  loading?: boolean;
  compact?: boolean;
};

export function Button({ variant = 'primary', icon, loading = false, compact = false, className = '', children, disabled, type = 'button', ...props }: Props) {
  return (
    <button type={type} className={`button button--${variant} ${compact ? 'button--compact' : ''} ${className}`}
      disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Icon name="loader" size={18} className="spin" /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
