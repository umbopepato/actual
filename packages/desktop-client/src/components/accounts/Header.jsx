import { useEffect, useState } from 'react';

import { SvgPencil1 } from '../../icons/v2';
import { theme } from '../../style';
import { Button } from '../common/Button';
import { InitialFocus } from '../common/InitialFocus';
import { Input } from '../common/Input';
import { View } from '../common/View';
import { NotesButton } from '../NotesButton';

import { Balances } from './Balance';

import { cn } from '@/util/ui';

export function AccountHeader({
  editingName,
  isNameEditable,
  accountName,
  account,
  accountsSyncing,
  failedAccounts,
  transactions,
  showExtraBalances,
  balanceQuery,
  filters,
  onToggleExtraBalances,
  onSaveName,
  onExposeName,
}) {
  const [draftName, setDraftName] = useState(accountName);

  useEffect(() => {
    setDraftName(accountName);
  }, [accountName]);

  return (
    <div className="flex items-center gap-2">
      <div>
        {!!account?.bank && (
          <View
            style={{
              backgroundColor: accountsSyncing.includes(account.id)
                ? theme.sidebarItemBackgroundPending
                : failedAccounts.has(account.id)
                  ? theme.sidebarItemBackgroundFailed
                  : theme.sidebarItemBackgroundPositive,
              marginRight: '4px',
              width: 8,
              height: 8,
              borderRadius: 8,
            }}
          />
        )}
        {isNameEditable ? (
          <Input
            className={cn(
              'text-xl font-bold',
              !editingName && 'cursor-pointer',
            )}
            onClick={() => {
              if (!editingName) {
                onExposeName(true);
              }
            }}
            value={draftName}
            readOnly={!editingName}
            onInput={e => setDraftName(e.target.value)}
            onEnter={() => onSaveName(draftName)}
            onBlur={() => onSaveName(draftName)}
            onEscape={() => onExposeName(false)}
            style={{
              width: Math.min(20, draftName.length) + 'ch',
            }}
          />
        ) : (
          <h1 className="text-xl font-bold" data-testid="account-name">
            {account && account.closed ? 'Closed: ' + accountName : accountName}
          </h1>
        )}
      </div>

      <Balances
        balanceQuery={balanceQuery}
        showExtraBalances={showExtraBalances}
        onToggleExtraBalances={onToggleExtraBalances}
        account={account}
        filteredItems={filters}
        transactions={transactions}
      />
    </div>
  );
}
