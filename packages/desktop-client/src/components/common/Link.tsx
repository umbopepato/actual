import React, {
  type MouseEventHandler,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { NavLink, useMatch } from 'react-router-dom';

import { type CustomReportEntity } from 'loot-core/types/models/reports';

import { Text } from './Text';

import { Button } from '@/components/ui/button';
import { useNavigate } from '@/hooks/useNavigate';
import { theme } from '@/style';
import { cn } from '@/util/ui';

type TextLinkProps = {
  onClick?: MouseEventHandler;
  children?: ReactNode;
};

type ButtonLinkProps = ComponentProps<typeof Button> & {
  to?: string;
  activeClass?: string;
};

type InternalLinkProps = {
  to?: string;
  activeClass?: string;
  children?: ReactNode;
  report?: CustomReportEntity;
};

const externalLinkColors = {
  purple: theme.pageTextPositive,
  blue: theme.pageTextLink,
  muted: 'inherit',
};

type ExternalLinkProps = {
  children?: ReactNode;
  to?: string;
  linkColor?: keyof typeof externalLinkColors;
};

const ExternalLink = ({
  children,
  to,
  linkColor = 'blue',
  ...props
}: ExternalLinkProps) => {
  return (
    // we can’t use <ExternalLink /> here for obvious reasons
    // eslint-disable-next-line no-restricted-syntax
    <a
      {...props}
      href={to ?? ''}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: externalLinkColors[linkColor] }}
    >
      {children}
    </a>
  );
};

const TextLink = ({ onClick, children, ...props }: TextLinkProps) => {
  return (
    <Text {...props} onClick={onClick}>
      {children}
    </Text>
  );
};

const ButtonLink = ({
  to,
  className,
  activeClass,
  ...props
}: ButtonLinkProps) => {
  const navigate = useNavigate();
  const path = to ?? '';
  const match = useMatch({ path });
  return (
    <Button
      {...props}
      className={cn(className, match && activeClass)}
      onClick={e => {
        props.onClick?.(e);
        if (!e.defaultPrevented) {
          navigate(path);
        }
      }}
    />
  );
};

const InternalLink = ({
  to,
  activeClass,
  children,
  report,
  className,
  ...props
}: InternalLinkProps) => {
  const path = to ?? '';
  const match = useMatch({ path });

  return (
    <NavLink
      {...props}
      to={path}
      className={cn(className, match && activeClass)}
      state={report ? { report } : {}}
    >
      {children}
    </NavLink>
  );
};

type LinkProps =
  | ({
      variant: 'button';
    } & ButtonLinkProps)
  | ({ variant?: 'internal' } & InternalLinkProps)
  | ({ variant?: 'external' } & ExternalLinkProps)
  | ({ variant?: 'text' } & TextLinkProps);

export function Link({ variant = 'internal', ...props }: LinkProps) {
  switch (variant) {
    case 'internal':
      return <InternalLink {...props} />;

    case 'external':
      return <ExternalLink {...props} />;

    case 'button':
      return <ButtonLink {...props} />;

    case 'text':
      return <TextLink {...props} />;

    default:
      throw new Error(`Unrecognised link type: ${variant}`);
  }
}
