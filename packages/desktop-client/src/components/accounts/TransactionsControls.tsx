import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  ReconcileTooltip,
  ReconcilingMessage,
} from '@/components/accounts/Reconcile';
import { AnimatedRefresh } from '@/components/AnimatedRefresh';
import { Button } from '@/components/common/Button';
import { Menu } from '@/components/common/Menu';
import { MenuButton } from '@/components/common/MenuButton';
import { MenuTooltip } from '@/components/common/MenuTooltip';
import { Search } from '@/components/common/Search';
import { Stack } from '@/components/common/Stack';
import { useLocalPref } from '@/hooks/useLocalPref';
import { useSplitsExpanded } from '@/hooks/useSplitsExpanded';
import { useSyncServerStatus } from '@/hooks/useSyncServerStatus';

import { AnimatedLoading } from '@/icons/AnimatedLoading';
import { SvgAdd } from '@/icons/v1';
import {
  SvgArrowsExpand3,
  SvgArrowsShrink3,
  SvgDownloadThickBottom,
} from '@/icons/v2';
import { View } from '@/components/common/View';
import { FilterButton } from '@/components/filters/FiltersMenu';
import { SelectedTransactionsButton } from '@/components/transactions/SelectedTransactions';
import { FiltersStack } from '@/components/filters/FiltersStack';

const AccountMenu = ({
  account,
  canSync,
  showBalances,
  canShowBalances,
  showCleared,
  showReconciled,
  onClose,
  isSorted,
  onReconcile,
  onMenuSelect,
}) => {
  const [tooltip, setTooltip] = useState('default');
  const syncServerStatus = useSyncServerStatus();

  return tooltip === 'reconcile' ? (
    <ReconcileTooltip
      account={account}
      onClose={onClose}
      onReconcile={onReconcile}
    />
  ) : (
    <MenuTooltip width={200} onClose={onClose}>
      <Menu
        onMenuSelect={item => {
          if (item === 'reconcile') {
            setTooltip('reconcile');
          } else {
            onMenuSelect(item);
          }
        }}
        items={[
          isSorted && {
            name: 'remove-sorting',
            text: 'Remove all sorting',
          },
          canShowBalances && {
            name: 'toggle-balance',
            text: (showBalances ? 'Hide' : 'Show') + ' running balance',
          },
          {
            name: 'toggle-cleared',
            text: (showCleared ? 'Hide' : 'Show') + ' “cleared” checkboxes',
          },
          {
            name: 'toggle-reconciled',
            text:
              (showReconciled ? 'Hide' : 'Show') + ' reconciled transactions',
          },
          { name: 'export', text: 'Export' },
          { name: 'reconcile', text: 'Reconcile' },
          account &&
            !account.closed &&
            (canSync
              ? {
                  name: 'unlink',
                  text: 'Unlink account',
                }
              : syncServerStatus === 'online' && {
                  name: 'link',
                  text: 'Link account',
                }),
          account.closed
            ? { name: 'reopen', text: 'Reopen account' }
            : { name: 'close', text: 'Close account' },
        ].filter(x => x)}
      />
    </MenuTooltip>
  );
};

const CategoryMenu = ({ onClose, onMenuSelect, isSorted }) => (
  <MenuTooltip width={200} onClose={onClose}>
    <Menu
      onMenuSelect={item => {
        onMenuSelect(item);
      }}
      items={[
        isSorted && {
          name: 'remove-sorting',
          text: 'Remove all sorting',
        },
        { name: 'export', text: 'Export' },
      ]}
    />
  </MenuTooltip>
);

export const TransactionsControls = ({
  account,
  accounts,
  accountsSyncing,
  balanceQuery,
  canCalculateBalance,
  conditionsOp,
  filterId,
  filters,
  filtersList,
  isSorted,
  onAddTransaction,
  onApplyFilter,
  onBatchDelete,
  onBatchDuplicate,
  onBatchEdit,
  onBatchUnlink,
  onClearFilters,
  onCondOpChange,
  onCreateReconciliationTransaction,
  onCreateRule,
  onDeleteFilter,
  onDoneReconciling,
  onImport,
  onMenuSelect,
  onReconcile,
  onReloadSavedFilter,
  onScheduleAction,
  onSearch,
  onSetTransfer,
  onShowTransactions,
  onSync,
  onUpdateFilter,
  pushModal,
  reconcileAmount,
  search,
  showBalances,
  showCleared,
  showEmptyMessage,
  showReconciled,
  tableRef,
  transactions,
  workingHard,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInput = useRef(null);
  const splitsExpanded = useSplitsExpanded();
  const syncServerStatus = useSyncServerStatus();
  const isUsingServer = syncServerStatus !== 'no-server';
  const [_, setExpandSplitsPref] = useLocalPref('expand-splits');

  const isServerOffline = syncServerStatus === 'offline';

  let canSync = account && account.account_id && isUsingServer;
  if (!account) {
    // All accounts - check for any syncable account
    canSync = !!accounts.find(account => !!account.account_id) && isUsingServer;
  }

  useHotkeys(
    'ctrl+f, cmd+f, meta+f',
    () => {
      if (searchInput.current) {
        searchInput.current.focus();
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
      scopes: ['app'],
    },
    [searchInput],
  );

  // Only show the ability to make linked transfers on multi-account views.
  const showMakeTransfer = !account;

  function onToggleSplits() {
    if (tableRef.current) {
      splitsExpanded.dispatch({
        type: 'switch-mode',
        id: tableRef.current.getScrolledItem(),
      });

      setExpandSplitsPref(!(splitsExpanded.state.mode === 'expand'));
    }
  }
  return (
    <>
      <Stack
        spacing={2}
        direction="row"
        align="center"
        style={{ marginTop: 12 }}
      >
        {((account && !account.closed) || canSync) && (
          <Button
            type="bare"
            onClick={canSync ? onSync : onImport}
            disabled={canSync && isServerOffline}
          >
            {canSync ? (
              <>
                <AnimatedRefresh
                  animating={
                    account
                      ? accountsSyncing.includes(account.id)
                      : accountsSyncing.length > 0
                  }
                />{' '}
                {isServerOffline ? 'Sync offline' : 'Sync'}
              </>
            ) : (
              <>
                <SvgDownloadThickBottom
                  width={13}
                  height={13}
                  style={{ marginRight: 4 }}
                />{' '}
                Import
              </>
            )}
          </Button>
        )}
        {!showEmptyMessage && (
          <Button type="bare" onClick={onAddTransaction}>
            <SvgAdd width={10} height={10} style={{ marginRight: 3 }} /> Add New
          </Button>
        )}
        <View style={{ flexShrink: 0 }}>
          <FilterButton onApply={onApplyFilter} type="accounts" />
        </View>
        <View style={{ flex: 1 }} />
        <Search
          placeholder="Search"
          value={search}
          onChange={onSearch}
          inputRef={searchInput}
        />
        {workingHard ? (
          <View>
            <AnimatedLoading style={{ width: 16, height: 16 }} />
          </View>
        ) : (
          <SelectedTransactionsButton
            getTransaction={id => transactions.find(t => t.id === id)}
            onShow={onShowTransactions}
            onDuplicate={onBatchDuplicate}
            onDelete={onBatchDelete}
            onEdit={onBatchEdit}
            onUnlink={onBatchUnlink}
            onCreateRule={onCreateRule}
            onSetTransfer={onSetTransfer}
            onScheduleAction={onScheduleAction}
            pushModal={pushModal}
            showMakeTransfer={showMakeTransfer}
          />
        )}
        <Button
          type="bare"
          disabled={search !== '' || filters.length > 0}
          style={{ padding: 6, marginLeft: 10 }}
          onClick={onToggleSplits}
          title={
            splitsExpanded.state.mode === 'collapse'
              ? 'Collapse split transactions'
              : 'Expand split transactions'
          }
        >
          {splitsExpanded.state.mode === 'collapse' ? (
            <SvgArrowsShrink3 style={{ width: 14, height: 14 }} />
          ) : (
            <SvgArrowsExpand3 style={{ width: 14, height: 14 }} />
          )}
        </Button>
        {account ? (
          <View>
            <MenuButton onClick={() => setMenuOpen(true)} />

            {menuOpen && (
              <AccountMenu
                account={account}
                canSync={canSync}
                canShowBalances={canCalculateBalance()}
                isSorted={isSorted}
                showBalances={showBalances}
                showCleared={showCleared}
                showReconciled={showReconciled}
                onMenuSelect={item => {
                  setMenuOpen(false);
                  onMenuSelect(item);
                }}
                onReconcile={onReconcile}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </View>
        ) : (
          <View>
            <MenuButton onClick={() => setMenuOpen(true)} />

            {menuOpen && (
              <CategoryMenu
                onMenuSelect={item => {
                  setMenuOpen(false);
                  onMenuSelect(item);
                }}
                onClose={() => setMenuOpen(false)}
                isSorted={isSorted}
              />
            )}
          </View>
        )}
      </Stack>

      {filters && filters.length > 0 && (
        <FiltersStack
          filters={filters}
          conditionsOp={conditionsOp}
          onUpdateFilter={onUpdateFilter}
          onDeleteFilter={onDeleteFilter}
          onClearFilters={onClearFilters}
          onReloadSavedFilter={onReloadSavedFilter}
          filterId={filterId}
          filtersList={filtersList}
          onCondOpChange={onCondOpChange}
        />
      )}

      {reconcileAmount != null && (
        <ReconcilingMessage
          targetBalance={reconcileAmount}
          balanceQuery={balanceQuery}
          onDone={onDoneReconciling}
          onCreateTransaction={onCreateReconciliationTransaction}
        />
      )}
    </>
  );
};
