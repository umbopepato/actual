// @ts-strict-ignore
import React, { type ReactElement, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend as Backend } from 'react-dnd-html5-backend';
import { useSelector } from 'react-redux';
import {
  Route,
  Routes,
  Navigate,
  BrowserRouter,
  useLocation,
  useHref,
} from 'react-router-dom';

import { SpreadsheetProvider } from 'loot-core/src/client/SpreadsheetProvider';
import { type State } from 'loot-core/src/client/state-types';
import { checkForUpdateNotification } from 'loot-core/src/client/update-notification';
import * as undo from 'loot-core/src/platform/client/undo';

import { useAccounts } from '../hooks/useAccounts';
import { useActions } from '../hooks/useActions';
import { useNavigate } from '../hooks/useNavigate';
import { useResponsive } from '../ResponsiveProvider';
import { theme } from '../style';
import { ExposeNavigate } from '../util/router-tools';
import { getIsOutdated, getLatestVersion } from '../util/versions';

import { BankSyncStatus } from './BankSyncStatus';
import { BudgetMonthCountProvider } from './budget/BudgetMonthCountContext';
import { View } from './common/View';
import { DashboardRouterLazy } from './dashboard';
import { GlobalKeys } from './GlobalKeys';
import { ManageRulesPage } from './ManageRulesPage';
import { Category } from './mobile/budget/Category';
import { MobileNavTabs } from './mobile/MobileNavTabs';
import { TransactionEdit } from './mobile/transactions/TransactionEdit';
import { Modals } from './Modals';
import { Notifications } from './Notifications';
import { ManagePayeesPage } from './payees/ManagePayeesPage';
import { NarrowAlternate, WideComponent } from './responsive';
import { ScrollProvider } from './ScrollProvider';
import { Settings } from './settings';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { Titlebar, TitlebarProvider } from './Titlebar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable';

import {
  BudgetMenu,
  SidebarNavigation,
} from '@/components/sidebar/SidebarNavigation';
import { Separator } from '@/components/ui/separator';

function NarrowNotSupported({
  redirectTo = '/budget',
  children,
}: {
  redirectTo?: string;
  children: ReactElement;
}) {
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  useEffect(() => {
    if (isNarrowWidth) {
      navigate(redirectTo);
    }
  }, [isNarrowWidth, navigate, redirectTo]);
  return isNarrowWidth ? null : children;
}

function WideNotSupported({ children, redirectTo = '/budget' }) {
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNarrowWidth) {
      navigate(redirectTo);
    }
  }, [isNarrowWidth, navigate, redirectTo]);
  return isNarrowWidth ? children : null;
}

function RouterBehaviors() {
  const navigate = useNavigate();
  const accounts = useAccounts();
  const accountsLoaded = useSelector(
    (state: State) => state.queries.accountsLoaded,
  );
  useEffect(() => {
    // If there are no accounts, we want to redirect the user to
    // the All Accounts screen which will prompt them to add an account
    if (accountsLoaded && accounts.length === 0) {
      navigate('/accounts');
    }
  }, [accountsLoaded, accounts]);

  const location = useLocation();
  const href = useHref(location);
  useEffect(() => {
    undo.setUndoState('url', href);
  }, [href]);

  return null;
}

function FinancesAppWithoutContext() {
  const actions = useActions();

  useEffect(() => {
    // Wait a little bit to make sure the sync button will get the
    // sync start event. This can be improved later.
    setTimeout(async () => {
      await actions.sync();

      await checkForUpdateNotification(
        actions.addNotification,
        getIsOutdated,
        getLatestVersion,
        actions.loadPrefs,
        actions.savePrefs,
      );
    }, 100);
  }, []);

  return (
    <BrowserRouter>
      <RouterBehaviors />
      <ExposeNavigate />

      <div className="h-screen">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            localStorage.setItem(
              `react-resizable-panels:layout`,
              JSON.stringify(sizes),
            );
          }}
          className="h-full items-stretch"
        >
          <ResizablePanel
            defaultSize={20}
            collapsible={false}
            minSize={15}
            maxSize={35}
            className="hidden md:flex flex-col min-w-[50px] transition-all duration-300 ease-in-out"
          >
            <div className="flex h-[52px] items-center justify-center px-2">
              <BudgetMenu />
            </div>

            <Separator />

            <div className="flex-1 overflow-y-auto">
              <SidebarNavigation />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden md:flex" />

          <ResizablePanel minSize={30}>
            <Titlebar />

            <Separator />

            <main className="relative pt-14">
              <Notifications />
              <BankSyncStatus />

              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                <Route path="/dashboard/*" element={<DashboardRouterLazy />} />

                <Route
                  path="/budget"
                  element={<NarrowAlternate name="Budget" />}
                />

                <Route
                  path="/schedules"
                  element={<WideComponent name="Schedules" />}
                />

                <Route path="/payees" element={<ManagePayeesPage />} />
                <Route path="/rules" element={<ManageRulesPage />} />
                <Route path="/settings" element={<Settings />} />

                <Route
                  path="/gocardless/link"
                  element={<WideComponent name="GoCardlessLink" />}
                />

                <Route
                  path="/accounts"
                  element={<WideComponent name="Accounts" />}
                />

                <Route
                  path="/accounts/:id"
                  element={<WideComponent name="Account" />}
                />

                <Route
                  path="/transactions/:transactionId"
                  element={<TransactionEdit />}
                />

                <Route path="/categories/:id" element={<Category />} />

                {/* redirect all other traffic to the dashboard page */}
                <Route
                  path="/*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              <Modals />

              {/*<Routes>
              <Route path="/budget" element={<MobileNavTabs />} />
              <Route path="/accounts" element={<MobileNavTabs />} />
              <Route path="/settings" element={<MobileNavTabs />} />
              <Route path="/dashboard" element={<MobileNavTabs />} />
              <Route path="*" element={null} />
            </Routes>*/}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </BrowserRouter>
  );
}

export function FinancesApp() {
  const app = useMemo(() => <FinancesAppWithoutContext />, []);

  return (
    <SpreadsheetProvider>
      <TitlebarProvider>
        <SidebarProvider>
          <BudgetMonthCountProvider>
            <DndProvider backend={Backend}>
              <ScrollProvider>{app}</ScrollProvider>
            </DndProvider>
          </BudgetMonthCountProvider>
        </SidebarProvider>
      </TitlebarProvider>
    </SpreadsheetProvider>
  );
}

const tmp = () => (
  <View style={{ height: '100%' }}>
    <GlobalKeys />

    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.pageBackground,
        flex: 1,
      }}
    >
      <SidebarNavigation />

      <View
        style={{
          color: theme.pageText,
          backgroundColor: theme.pageBackground,
          flex: 1,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Titlebar
            style={{
              WebkitAppRegion: 'drag',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          />
          <Notifications />
          <BankSyncStatus />

          <Routes>
            <Route path="/" element={<Navigate to="/budget" replace />} />

            <Route path="/dashboard/*" element={<DashboardRouterLazy />} />

            <Route path="/budget" element={<NarrowAlternate name="Budget" />} />

            <Route
              path="/schedules"
              element={
                <NarrowNotSupported>
                  <WideComponent name="Schedules" />
                </NarrowNotSupported>
              }
            />

            <Route path="/payees" element={<ManagePayeesPage />} />
            <Route path="/rules" element={<ManageRulesPage />} />
            <Route path="/settings" element={<Settings />} />

            <Route
              path="/gocardless/link"
              element={
                <NarrowNotSupported>
                  <WideComponent name="GoCardlessLink" />
                </NarrowNotSupported>
              }
            />

            <Route
              path="/accounts"
              element={<NarrowAlternate name="Accounts" />}
            />

            <Route
              path="/accounts/:id"
              element={<NarrowAlternate name="Account" />}
            />

            <Route
              path="/transactions/:transactionId"
              element={
                <WideNotSupported>
                  <TransactionEdit />
                </WideNotSupported>
              }
            />

            <Route
              path="/categories/:id"
              element={
                <WideNotSupported>
                  <Category />
                </WideNotSupported>
              }
            />

            {/* redirect all other traffic to the budget page */}
            <Route path="/*" element={<Navigate to="/budget" replace />} />
          </Routes>

          <Modals />
        </div>

        <Routes>
          <Route path="/budget" element={<MobileNavTabs />} />
          <Route path="/accounts" element={<MobileNavTabs />} />
          <Route path="/settings" element={<MobileNavTabs />} />
          <Route path="/dashboard" element={<MobileNavTabs />} />
          <Route path="*" element={null} />
        </Routes>
      </View>
    </View>
  </View>
);
