// @ts-strict-ignore
import { type MouseEventHandler, type ReactNode } from 'react';

import { type LucideIcon } from 'lucide-react';

import { type CSSProperties } from '../../style';
import { Link } from '../common/Link';

type ItemProps = {
  title: string;
  Icon: LucideIcon;
  to?: string;
  children?: ReactNode;
  style?: CSSProperties;
  indent?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
  forceHover?: boolean;
  forceActive?: boolean;
};

export function Item({
  Icon,
  title,
  to,
  onClick,
  forceHover = false,
  forceActive = false,
}: ItemProps) {
  const Component = onClick ? 'div' : Link;
  return (
    <Component
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${onClick ? 'cursor-pointer' : ''}`}
      {...(Component === Link ? { activeClass: 'bg-muted text-primary' } : {})}
    >
      <Icon className="h-4 w-4" />
      {title}
    </Component>
  );
}
