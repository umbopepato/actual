// @ts-strict-ignore
import React, { useState, useMemo, type CSSProperties } from 'react';

import {
  type ScheduleStatusType,
  type ScheduleStatuses,
} from 'loot-core/src/client/data-hooks/schedules';
import { format as monthUtilFormat } from 'loot-core/src/shared/months';
import { getScheduledAmount } from 'loot-core/src/shared/schedules';
import { integerToCurrency } from 'loot-core/src/shared/util';
import { type ScheduleEntity } from 'loot-core/src/types/models';

import { useAccounts } from '../../hooks/useAccounts';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePayees } from '../../hooks/usePayees';
import { SvgDotsHorizontalTriple } from '../../icons/v1';
import { SvgCheck } from '../../icons/v2';
import { theme } from '../../style';
import { Button } from '../common/Button';
import { Menu } from '../common/Menu';
import { Text } from '../common/Text';
import { View } from '../common/View';
import { PrivacyFilter } from '../PrivacyFilter';
import { Table, TableHeader, Row, Field, Cell } from '../table';
import { Tooltip } from '../tooltips';
import { DisplayId } from '../util/DisplayId';

import { StatusBadge } from './StatusBadge';

type SchedulesTableProps = {
  schedules: ScheduleEntity[];
  statuses: ScheduleStatuses;
  filter: string;
  allowCompleted: boolean;
  onSelect: (id: ScheduleEntity['id']) => void;
  onAction: (actionName: ScheduleItemAction, id: ScheduleEntity['id']) => void;
  style: CSSProperties;
  minimal?: boolean;
  tableStyle?: CSSProperties;
};

type CompletedScheduleItem = { id: 'show-completed' };
type SubTotalScheduleItem = {
  id: `subtotal-${string}`;
  title: string;
  income: number;
  expenses: number;
};
type TotalScheduleItem = { id: 'total' };
type SchedulesTableItem =
  | ScheduleEntity
  | CompletedScheduleItem
  | SubTotalScheduleItem
  | TotalScheduleItem;

export type ScheduleItemAction =
  | 'post-transaction'
  | 'skip'
  | 'complete'
  | 'restart'
  | 'delete';

export const ROW_HEIGHT = 43;

function OverflowMenu({
  schedule,
  status,
  onAction,
}: {
  schedule: ScheduleEntity;
  status: ScheduleStatusType;
  onAction: SchedulesTableProps['onAction'];
}) {
  const [open, setOpen] = useState(false);

  const getMenuItems = () => {
    const menuItems: { name: ScheduleItemAction; text: string }[] = [];

    menuItems.push({
      name: 'post-transaction',
      text: 'Post transaction',
    });

    if (status === 'completed') {
      menuItems.push({
        name: 'restart',
        text: 'Restart',
      });
    } else {
      menuItems.push(
        {
          name: 'skip',
          text: 'Skip next date',
        },
        {
          name: 'complete',
          text: 'Complete',
        },
      );
    }

    menuItems.push({ name: 'delete', text: 'Delete' });

    return menuItems;
  };

  return (
    <View>
      <Button
        type="bare"
        aria-label="Menu"
        onClick={e => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <SvgDotsHorizontalTriple
          width={15}
          height={15}
          style={{ transform: 'rotateZ(90deg)' }}
        />
      </Button>
      {open && (
        <Tooltip
          position="bottom-right"
          width={150}
          style={{ padding: 0 }}
          onClose={() => setOpen(false)}
        >
          <Menu
            onMenuSelect={name => {
              onAction(name, schedule.id);
              setOpen(false);
            }}
            items={getMenuItems()}
          />
        </Tooltip>
      )}
    </View>
  );
}

export function FormattedAmount({
  amount,
  isApprox,
  ellipsize = false,
  highlightExpense = false,
}: {
  amount: number;
  isApprox?: boolean;
  ellipsize?: boolean;
  highlightExpense?: boolean;
}) {
  const str = integerToCurrency(Math.abs(amount || 0));
  return (
    <Text
      style={{
        flex: 1,
        color:
          amount > 0
            ? theme.noticeTextLight
            : highlightExpense
              ? theme.errorText
              : theme.tableText,
        ...(ellipsize
          ? {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }
          : {}),
      }}
      title={(isApprox ? 'Approximately ' : '') + str}
    >
      <PrivacyFilter>
        {amount > 0 ? `+${str}` : `${highlightExpense ? '-' : ''}${str}`}
      </PrivacyFilter>
    </Text>
  );
}

export function ScheduleAmountCell({
  amount,
  op,
}: {
  amount: ScheduleEntity['_amount'];
  op?: ScheduleEntity['_amountOp'];
}) {
  const num = getScheduledAmount(amount);
  const isApprox = op === 'isapprox' || op === 'isbetween';

  return (
    <Cell
      width={100}
      plain
      style={{
        textAlign: 'right',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 5px',
      }}
      name="amount"
    >
      {isApprox && (
        <View
          style={{
            textAlign: 'left',
            color: theme.pageTextSubdued,
            lineHeight: '1em',
            marginRight: 10,
          }}
          title={isApprox ? 'Approximately ' : ''}
        >
          ~
        </View>
      )}
      <FormattedAmount amount={num} isApprox={isApprox} ellipsize />
    </Cell>
  );
}

type Frequency = ScheduleEntity['_date']['frequency'];

type SchedulesByFrequency = Partial<
  Record<Frequency, Record<number, ScheduleEntity[]>>
> & {
  once?: ScheduleEntity[];
};

const calculateTotal = (schedules: ScheduleEntity[]) =>
  schedules.reduce(
    (total, schedule) => total + getScheduledAmount(schedule._amount),
    0,
  );

const notCompleted = s => !s.completed;

const isSubTotalItem = (
  item: SchedulesTableItem,
): item is SubTotalScheduleItem => {
  return item.id.startsWith('subtotal');
};

const frequencyNouns: Record<Frequency, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

const formatRecurrence = (frequency: Frequency, interval: number) => {
  return [
    'Every',
    interval !== 1 && interval,
    frequencyNouns[frequency] + (interval !== 1 ? 's' : ''),
  ]
    .filter(Boolean)
    .join(' ');
};

export function SchedulesTable({
  schedules,
  statuses,
  filter,
  minimal,
  allowCompleted,
  style,
  onSelect,
  onAction,
  tableStyle,
}: SchedulesTableProps) {
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';
  const [showCompleted, setShowCompleted] = useState(false);

  const payees = usePayees();
  const accounts = useAccounts();
  const hasCompletedSchedules = useMemo(
    () => schedules.some(s => s.completed),
    [schedules],
  );

  const filteredSchedules = useMemo(
    () =>
      allowCompleted && showCompleted
        ? schedules
        : schedules.filter(notCompleted),
    [schedules, allowCompleted, showCompleted],
  );

  const searchedSchedules = useMemo(() => {
    if (!filter) {
      return filteredSchedules;
    }
    const filterIncludes = (str: string) =>
      str
        ? str.toLowerCase().includes(filter.toLowerCase()) ||
          filter.toLowerCase().includes(str.toLowerCase())
        : false;

    return filteredSchedules.filter(schedule => {
      const payee = payees.find(p => schedule._payee === p.id);
      const account = accounts.find(a => schedule._account === a.id);
      const amount = getScheduledAmount(schedule._amount);
      const amountStr =
        (schedule._amountOp === 'isapprox' || schedule._amountOp === 'isbetween'
          ? '~'
          : '') +
        (amount > 0 ? '+' : '') +
        integerToCurrency(Math.abs(amount || 0));
      const dateStr = schedule.next_date
        ? monthUtilFormat(schedule.next_date, dateFormat)
        : null;

      return (
        filterIncludes(schedule.name) ||
        filterIncludes(payee && payee.name) ||
        filterIncludes(account && account.name) ||
        filterIncludes(amountStr) ||
        filterIncludes(statuses.get(schedule.id)) ||
        filterIncludes(dateStr)
      );
    });
  }, [payees, accounts, filteredSchedules, filter, statuses]);

  const groupedSchedules = useMemo(
    () =>
      searchedSchedules.reduce<SchedulesByFrequency>((groups, schedule) => {
        if (schedule._date?.frequency) {
          const group = (groups[schedule._date.frequency] =
            groups[schedule._date.frequency] ?? {});
          const interval = (group[schedule._date.interval ?? 1] =
            group[schedule._date.interval ?? 1] ?? []);
          interval.push(schedule);
        } else {
          (groups.once = groups.once ?? []).push(schedule);
        }
        return groups;
      }, {}),
    [searchedSchedules],
  );

  const items: SchedulesTableItem[] = useMemo(() => {
    const _items = [];

    if (groupedSchedules.once?.length) {
      _items.push({
        id: 'subtotal-once',
        title: 'One-time',
        income: calculateTotal(
          groupedSchedules.once.filter(s => getScheduledAmount(s._amount) > 0),
        ),
        expenses: calculateTotal(
          groupedSchedules.once.filter(s => getScheduledAmount(s._amount) < 0),
        ),
      });
      _items.push(...groupedSchedules.once);
    }

    (['daily', 'weekly', 'monthly', 'yearly'] as const).forEach(frequency => {
      if (groupedSchedules[frequency]) {
        Object.entries(groupedSchedules[frequency]).forEach(
          ([interval, intervalSchedules]) => {
            if (intervalSchedules?.length) {
              _items.push({
                id: `subtotal-${frequency}-${interval}`,
                title: formatRecurrence(frequency, +interval),
                income: calculateTotal(
                  intervalSchedules.filter(
                    s => getScheduledAmount(s._amount) > 0,
                  ),
                ),
                expenses: calculateTotal(
                  intervalSchedules.filter(
                    s => getScheduledAmount(s._amount) < 0,
                  ),
                ),
              });
              _items.push(...intervalSchedules);
            }
          },
        );
      }
    });

    if (allowCompleted && hasCompletedSchedules) {
      _items.push({ id: 'show-completed' });
    }

    return _items;
  }, [searchedSchedules, showCompleted, allowCompleted]);

  function renderSchedule({ schedule }: { schedule: ScheduleEntity }) {
    return (
      <Row
        height={ROW_HEIGHT}
        inset={15}
        onClick={() => onSelect(schedule.id)}
        style={{
          cursor: 'pointer',
          backgroundColor: theme.tableBackground,
          color: theme.tableText,
          ':hover': { backgroundColor: theme.tableRowBackgroundHover },
        }}
      >
        <Field width="flex" name="name">
          <Text
            style={
              schedule.name == null
                ? { color: theme.buttonNormalDisabledText }
                : null
            }
            title={schedule.name ? schedule.name : ''}
          >
            {schedule.name ? schedule.name : 'None'}
          </Text>
        </Field>
        <Field width="flex" name="payee">
          <DisplayId type="payees" id={schedule._payee} />
        </Field>
        <Field width="flex" name="account">
          <DisplayId type="accounts" id={schedule._account} />
        </Field>
        <Field width={110} name="date">
          {schedule.next_date
            ? monthUtilFormat(schedule.next_date, dateFormat)
            : null}
        </Field>
        <Field width={120} name="status" style={{ alignItems: 'flex-start' }}>
          <StatusBadge status={statuses.get(schedule.id)} />
        </Field>
        <ScheduleAmountCell amount={schedule._amount} op={schedule._amountOp} />
        {!minimal && (
          <Field width={80} style={{ textAlign: 'center' }}>
            {schedule._date && schedule._date.frequency && (
              <SvgCheck style={{ width: 13, height: 13 }} />
            )}
          </Field>
        )}
        {!minimal && (
          <Field width={40} name="actions">
            <OverflowMenu
              schedule={schedule}
              status={statuses.get(schedule.id)}
              onAction={onAction}
            />
          </Field>
        )}
      </Row>
    );
  }

  function renderItem({ item }: { item: SchedulesTableItem }) {
    if (item.id === 'show-completed') {
      return (
        <Row
          height={ROW_HEIGHT}
          inset={15}
          style={{
            cursor: 'pointer',
            backgroundColor: 'transparent',
            ':hover': { backgroundColor: theme.tableRowBackgroundHover },
          }}
          onClick={() => setShowCompleted(true)}
        >
          <Field
            width="flex"
            style={{
              fontStyle: 'italic',
              textAlign: 'center',
              color: theme.tableText,
            }}
          >
            Show completed schedules
          </Field>
        </Row>
      );
    } else if (isSubTotalItem(item)) {
      const total = item.income + item.expenses;
      return (
        <Row
          height={ROW_HEIGHT}
          inset={15}
          style={{
            position: 'sticky',
            top: 0,
          }}
        >
          <Field
            width="flex"
            name="name"
            style={{ fontSize: 14, fontWeight: 'bold' }}
          >
            <Text>{item.title}</Text>
          </Field>
          <Cell
            plain
            style={{
              fontSize: 14,
              fontWeight: 'medium',
              textAlign: 'right',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0 5px',
              gap: '3px',
            }}
            name="amounts"
          >
            {item.income !== 0 && item.expenses !== 0 && (
              <>
                <FormattedAmount amount={item.income} />
                <FormattedAmount amount={item.expenses} highlightExpense />
                <span>=</span>
              </>
            )}
            <FormattedAmount amount={total} highlightExpense />
          </Cell>
          {!minimal && <Field width={80} />}
          {!minimal && <Field width={40} />}
        </Row>
      );
    }
    return renderSchedule({ schedule: item as ScheduleEntity });
  }

  return (
    <View style={{ flex: 1, ...tableStyle }}>
      <TableHeader height={ROW_HEIGHT} inset={15}>
        <Field width="flex">Name</Field>
        <Field width="flex">Payee</Field>
        <Field width="flex">Account</Field>
        <Field width={110}>Next date</Field>
        <Field width={120}>Status</Field>
        <Field width={100} style={{ textAlign: 'right' }}>
          Amount
        </Field>
        {!minimal && (
          <Field width={80} style={{ textAlign: 'center' }}>
            Recurring
          </Field>
        )}
        {!minimal && <Field width={40} />}
      </TableHeader>
      <Table
        rowHeight={ROW_HEIGHT}
        backgroundColor="transparent"
        style={{ flex: 1, backgroundColor: 'transparent', ...style }}
        items={items as ScheduleEntity[]}
        renderItem={renderItem}
        renderEmpty={filter ? 'No matching schedules' : 'No schedules'}
        allowPopupsEscape={items.length < 6}
      />
    </View>
  );
}
