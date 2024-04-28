// @ts-strict-ignore
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';

import {
  CreditCardIcon,
  CrossIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
} from 'lucide-react';

import * as queries from 'loot-core/src/client/queries';
import { type State } from 'loot-core/src/client/state-types';

import { useBudgetedAccounts } from '../../hooks/useBudgetedAccounts';
import { useClosedAccounts } from '../../hooks/useClosedAccounts';
import { useFailedAccounts } from '../../hooks/useFailedAccounts';
import { useLocalPref } from '../../hooks/useLocalPref';
import { useOffBudgetAccounts } from '../../hooks/useOffBudgetAccounts';
import { useUpdatedAccounts } from '../../hooks/useUpdatedAccounts';
import { type OnDropCallback } from '../sort';

import { Account } from './Account';

import { Item } from '@/components/sidebar/Item';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const fontWeight = 600;

type AccountsProps = {
  onAddAccount: () => void;
  onToggleClosedAccounts: () => void;
  onReorder: OnDropCallback;
};

export function Accounts({
  onAddAccount,
  onToggleClosedAccounts,
  onReorder,
}: AccountsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const failedAccounts = useFailedAccounts();
  const updatedAccounts = useUpdatedAccounts();
  const offbudgetAccounts = useOffBudgetAccounts();
  const budgetedAccounts = useBudgetedAccounts();
  const closedAccounts = useClosedAccounts();
  const syncingAccountIds = useSelector(
    (state: State) => state.account.accountsSyncing,
  );
  const match = useMatch({ path: '/accounts/*' });

  const getAccountPath = account => `/accounts/${account.id}`;

  const [showClosedAccounts] = useLocalPref('ui.showClosedAccounts');

  function onDragChange(drag) {
    setIsDragging(drag.state === 'start');
  }

  const makeDropPadding = i => {
    if (i === 0) {
      return {
        paddingTop: isDragging ? 15 : 0,
        marginTop: isDragging ? -15 : 0,
      };
    }
    return null;
  };

  return (
    <Collapsible open={!!match}>
      <CollapsibleTrigger asChild>
        <Account
          name="Accounts"
          to="/accounts"
          Icon={CreditCardIcon}
          query={queries.allAccountBalance()}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="mb-4">
        {budgetedAccounts.length > 0 && (
          <div className="my-4">
            <Account
              name="Budgeted accounts"
              to="/accounts/budgeted"
              query={queries.budgetedAccountBalance()}
              Icon={PowerIcon}
            />
            {budgetedAccounts.map((account, i) => (
              <Account
                key={account.id}
                name={account.name}
                account={account}
                connected={!!account.bank}
                pending={syncingAccountIds.includes(account.id)}
                failed={failedAccounts && failedAccounts.has(account.id)}
                updated={
                  updatedAccounts && updatedAccounts.includes(account.id)
                }
                to={getAccountPath(account)}
                query={queries.accountBalance(account)}
                onDragChange={onDragChange}
                onDrop={onReorder}
                outerStyle={makeDropPadding(i)}
              />
            ))}
          </div>
        )}

        {offbudgetAccounts.length > 0 && (
          <div className="my-4">
            <Account
              name="Off budget"
              to="/accounts/offbudget"
              query={queries.offbudgetAccountBalance()}
              Icon={PowerOffIcon}
            />
            {offbudgetAccounts.map((account, i) => (
              <Account
                key={account.id}
                name={account.name}
                account={account}
                connected={!!account.bank}
                pending={syncingAccountIds.includes(account.id)}
                failed={failedAccounts && failedAccounts.has(account.id)}
                updated={
                  updatedAccounts && updatedAccounts.includes(account.id)
                }
                to={getAccountPath(account)}
                query={queries.accountBalance(account)}
                onDragChange={onDragChange}
                onDrop={onReorder}
                outerStyle={makeDropPadding(i)}
              />
            ))}
          </div>
        )}

        {closedAccounts.length > 0 && (
          <Collapsible open={showClosedAccounts}>
            <CollapsibleTrigger asChild>
              <Item
                title={'Closed accounts' + (showClosedAccounts ? '' : '...')}
                onClick={onToggleClosedAccounts}
                Icon={CrossIcon}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="my-4">
              {closedAccounts.map(account => (
                <Account
                  key={account.id}
                  name={account.name}
                  account={account}
                  to={getAccountPath(account)}
                  query={queries.accountBalance(account)}
                  onDragChange={onDragChange}
                  onDrop={onReorder}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Item onClick={onAddAccount} Icon={PlusIcon} title="Add account" />
      </CollapsibleContent>
    </Collapsible>
  );
}
