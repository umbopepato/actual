// @ts-strict-ignore
import React from 'react';

import { css } from 'glamor';
import { type LucideIcon } from 'lucide-react';

import { type AccountEntity } from 'loot-core/src/types/models';

import { styles, theme, type CSSProperties } from '../../style';
import { Link } from '../common/Link';
import { View } from '../common/View';
import {
  useDraggable,
  useDroppable,
  DropHighlight,
  type OnDragChangeCallback,
  type OnDropCallback,
} from '../sort';
import { type Binding } from '../spreadsheet';
import { CellValue } from '../spreadsheet/CellValue';

export const accountNameStyle: CSSProperties = {
  marginTop: -2,
  marginBottom: 2,
  paddingTop: 4,
  paddingBottom: 4,
  paddingRight: 15,
  paddingLeft: 10,
  textDecoration: 'none',
  color: theme.sidebarItemText,
  ':hover': { backgroundColor: theme.sidebarItemBackgroundHover },
  ...styles.smallText,
};

type AccountProps = {
  name: string;
  to: string;
  query?: Binding;
  account?: AccountEntity;
  connected?: boolean;
  pending?: boolean;
  failed?: boolean;
  updated?: boolean;
  style?: CSSProperties;
  outerStyle?: CSSProperties;
  onDragChange?: OnDragChangeCallback<{ id: string }>;
  onDrop?: OnDropCallback;
  Icon?: LucideIcon;
};

export function Account({
  name,
  account,
  connected,
  pending = false,
  failed,
  updated,
  to,
  query,
  style,
  outerStyle,
  onDragChange,
  onDrop,
  Icon,
}: AccountProps) {
  const type = account
    ? account.closed
      ? 'account-closed'
      : account.offbudget
        ? 'account-offbudget'
        : 'account-onbudget'
    : 'title';

  const { dragRef } = useDraggable({
    type,
    onDragChange,
    item: { id: account && account.id },
    canDrag: account != null,
  });

  const { dropRef, dropPos } = useDroppable({
    types: account ? [type] : [],
    id: account && account.id,
    onDrop,
  });

  return (
    <View innerRef={dropRef} style={{ flexShrink: 0, ...outerStyle }}>
      <View>
        <DropHighlight pos={dropPos} />
        <View innerRef={dragRef}>
          <Link
            to={to}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            activeClass="bg-muted text-primary"
            // style={{
            //   ...accountNameStyle,
            //   ...style,
            //   position: 'relative',
            //   borderLeft: '4px solid transparent',
            //   ...(updated && { fontWeight: 700 }),
            // }}
            // activeStyle={{
            //   borderColor: theme.sidebarItemAccentSelected,
            //   color: theme.sidebarItemTextSelected,
            //   // This is kind of a hack, but we don't ever want the account
            //   // that the user is looking at to be "bolded" which means it
            //   // has unread transactions. The system does mark is read and
            //   // unbolds it, but it still "flashes" bold so this just
            //   // ignores it if it's active
            //   fontWeight: (style && style.fontWeight) || 'normal',
            //   '& .dot': {
            //     backgroundColor: theme.sidebarItemAccentSelected,
            //     transform: 'translateX(-4.5px)',
            //   },
            // }}
          >
            {Icon ? (
              <Icon className="w-4 h-4" />
            ) : (
              <div
                className={`dot m-1 w-2 h-2 rounded ${css({
                  backgroundColor: pending
                    ? theme.sidebarItemBackgroundPending
                    : failed
                      ? theme.sidebarItemBackgroundFailed
                      : theme.sidebarItemBackgroundPositive,
                  opacity: connected ? 1 : 0,
                })}`}
              />
            )}

            {name}

            {query && (
              <span className="ml-auto text-xs">
                <CellValue binding={query} type="financial" />
              </span>
            )}
          </Link>
        </View>
      </View>
    </View>
  );
}
