import React from 'react';
import { useDispatch } from 'react-redux';

import {
  BarChartBigIcon,
  ChevronDownIcon,
  CogIcon,
  WalletCardsIcon,
  WalletIcon,
} from 'lucide-react';

import {
  closeBudget,
  moveAccount,
  replaceModal,
} from 'loot-core/src/client/actions';
import * as Platform from 'loot-core/src/client/platform';

import { Item } from './Item';
import { useSidebar } from './SidebarProvider';

import { Accounts } from '@/components/sidebar/Accounts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccounts } from '@/hooks/useAccounts';
import { useGlobalPref } from '@/hooks/useGlobalPref';
import { useLocalPref } from '@/hooks/useLocalPref';

export const SIDEBAR_WIDTH = 240;

export const SidebarNavigation = () => {
  const hasWindowButtons = !Platform.isBrowser && Platform.OS === 'mac';

  const dispatch = useDispatch();
  const sidebar = useSidebar();
  const accounts = useAccounts();
  const [showClosedAccounts, setShowClosedAccountsPref] = useLocalPref(
    'ui.showClosedAccounts',
  );
  const [isFloating = false, setFloatingSidebarPref] =
    useGlobalPref('floatingSidebar');

  async function onReorder(
    id: string,
    dropPos: 'top' | 'bottom',
    targetId: unknown,
  ) {
    let targetIdToMove = targetId;
    if (dropPos === 'bottom') {
      const idx = accounts.findIndex(a => a.id === targetId) + 1;
      targetIdToMove = idx < accounts.length ? accounts[idx].id : null;
    }

    dispatch(moveAccount(id, targetIdToMove));
  }

  const onFloat = () => {
    setFloatingSidebarPref(!isFloating);
  };

  const onAddAccount = () => {
    dispatch(replaceModal('add-account'));
  };

  const onToggleClosedAccounts = () => {
    setShowClosedAccountsPref(!showClosedAccounts);
  };

  return (
    <nav className="grid items-start p-2 text-sm font-medium">
      <Item title="Dashboard" Icon={BarChartBigIcon} to="/reports" />

      <Accounts
        onAddAccount={onAddAccount}
        onToggleClosedAccounts={onToggleClosedAccounts}
        onReorder={onReorder}
      />

      <Item title="Budget" Icon={WalletIcon} to="/budget" />

      {/*<Item title="Schedules" Icon={CalendarIcon} to="/schedules" />

            <Item title="Payees" Icon={StoreIcon} to="/payees" />

            <Item title="Rules" Icon={SlidersVerticalIcon} to="/rules" />*/}

      <Item title="Settings" Icon={CogIcon} to="/settings" />
    </nav>
  );
};

export const BudgetMenu = () => {
  const dispatch = useDispatch();
  const [budgetName] = useLocalPref('budgetName');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="px-3 py-2 gap-3 h-[unset] w-full">
          <WalletCardsIcon className="h-4 w-4" />
          {budgetName || 'Unnamed budget'}
          <span className="sr-only">Toggle budget menu</span>
          <ChevronDownIcon className="ml-auto w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Platform.isBrowser && (
          <DropdownMenuItem
            onClick={() => {
              window.open('https://actualbudget.org/docs/', '_blank');
            }}
          >
            Help
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            dispatch(closeBudget());
          }}
        >
          Close file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
