import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
  type ReactNode,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useLocation } from 'react-router-dom';

import { EyeIcon, EyeOff, TriangleAlertIcon } from 'lucide-react';

import * as queries from 'loot-core/src/client/queries';
import { listen } from 'loot-core/src/platform/client/fetch';
import { type LocalPrefs } from 'loot-core/src/types/prefs';

import { AnimatedRefresh } from './AnimatedRefresh';
import { MonthCountSelector } from './budget/MonthCountSelector';
import { Link } from './common/Link';
import { Paragraph } from './common/Paragraph';
import { Popover } from './common/Popover';
import { Text } from './common/Text';
import { View } from './common/View';
import { LoggedInUser } from './LoggedInUser';
import { useServerURL } from './ServerContext';
import { useSidebar } from './sidebar/SidebarProvider';
import { useSheetValue } from './spreadsheet/useSheetValue';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useActions } from '@/hooks/useActions';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useGlobalPref } from '@/hooks/useGlobalPref';
import { useLocalPref } from '@/hooks/useLocalPref';
import { useNavigate } from '@/hooks/useNavigate';
import { useResponsive } from '@/ResponsiveProvider';
import { theme } from '@/style';

export const SWITCH_BUDGET_MESSAGE_TYPE = 'budget/switch-type';

type SwitchBudgetTypeMessage = {
  type: typeof SWITCH_BUDGET_MESSAGE_TYPE;
  payload: {
    newBudgetType: LocalPrefs['budgetType'];
  };
};
export type TitlebarMessage = SwitchBudgetTypeMessage;

type Listener = (msg: TitlebarMessage) => void;
export type TitlebarContextValue = {
  sendEvent: (msg: TitlebarMessage) => void;
  subscribe: (listener: Listener) => () => void;
};

export const TitlebarContext = createContext<TitlebarContextValue>({
  sendEvent() {
    throw new Error('TitlebarContext not initialized');
  },
  subscribe() {
    throw new Error('TitlebarContext not initialized');
  },
});

type TitlebarProviderProps = {
  children?: ReactNode;
};

export function TitlebarProvider({ children }: TitlebarProviderProps) {
  const listeners = useRef<Listener[]>([]);

  function sendEvent(msg: TitlebarMessage) {
    listeners.current.forEach(func => func(msg));
  }

  function subscribe(listener: Listener) {
    listeners.current.push(listener);
    return () =>
      (listeners.current = listeners.current.filter(func => func !== listener));
  }

  return (
    <TitlebarContext.Provider value={{ sendEvent, subscribe }}>
      {children}
    </TitlebarContext.Provider>
  );
}

function UncategorizedButton() {
  const count: number | null = useSheetValue(queries.uncategorizedCount());
  if (count === null || count <= 0) {
    return null;
  }

  return (
    <Link
      variant="button"
      type="bare"
      to="/accounts/uncategorized"
      style={{
        color: theme.errorText,
      }}
    >
      {count} uncategorized {count === 1 ? 'transaction' : 'transactions'}
    </Link>
  );
}

function PrivacyButton() {
  const [isPrivacyEnabled, setPrivacyEnabledPref] =
    useLocalPref('isPrivacyEnabled');

  return (
    <Tooltip>
      <TooltipTrigger>
        <Switch
          checked={!isPrivacyEnabled}
          onCheckedChange={checked => setPrivacyEnabledPref(!checked)}
          Icon={isPrivacyEnabled ? EyeOff : EyeIcon}
        />
      </TooltipTrigger>
      <TooltipContent>
        {`${isPrivacyEnabled ? 'Disable' : 'Enable'} privacy mode`}
      </TooltipContent>
    </Tooltip>
  );
}

const SyncButton = () => {
  const [cloudFileId] = useLocalPref('cloudFileId');
  const { sync } = useActions();

  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<
    null | 'offline' | 'local' | 'disabled' | 'error'
  >(null);

  useEffect(() => {
    const unlisten = listen('sync-event', ({ type, subtype, syncDisabled }) => {
      if (type === 'start') {
        setSyncing(true);
        setSyncState(null);
      } else {
        // Give the layout some time to apply the starting animation
        // so we always finish it correctly even if it's almost
        // instant
        setTimeout(() => {
          setSyncing(false);
        }, 200);
      }

      if (type === 'error') {
        // Use the offline state if either there is a network error or
        // if this file isn't a "cloud file". You can't sync a local
        // file.
        if (subtype === 'network') {
          setSyncState('offline');
        } else if (!cloudFileId) {
          setSyncState('local');
        } else {
          setSyncState('error');
        }
      } else if (type === 'success') {
        setSyncState(syncDisabled ? 'disabled' : null);
      }
    });

    return unlisten;
  }, []);

  useHotkeys(
    'ctrl+s, cmd+s, meta+s',
    sync,
    {
      enableOnFormTags: true,
      preventDefault: true,
      scopes: ['app'],
    },
    [sync],
  );

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" onClick={sync}>
          {syncState === 'error' ? (
            <TriangleAlertIcon className="w-4 h-4" />
          ) : (
            <AnimatedRefresh animating={syncing} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {syncState === 'disabled'
          ? 'Disabled'
          : syncState === 'offline'
            ? 'Offline'
            : 'Sync'}
      </TooltipContent>
    </Tooltip>
  );
};

function BudgetTitlebar() {
  const [maxMonths, setMaxMonthsPref] = useGlobalPref('maxMonths');
  const [budgetType] = useLocalPref('budgetType');
  const { sendEvent } = useContext(TitlebarContext);

  const [loading, setLoading] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const triggerRef = useRef(null);

  const reportBudgetEnabled = useFeatureFlag('reportBudget');

  function onSwitchType() {
    setLoading(true);
    if (!loading) {
      const newBudgetType = budgetType === 'rollover' ? 'report' : 'rollover';
      sendEvent({
        type: SWITCH_BUDGET_MESSAGE_TYPE,
        payload: {
          newBudgetType,
        },
      });
    }
  }

  useEffect(() => {
    setLoading(false);
  }, [budgetType]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MonthCountSelector
        maxMonths={maxMonths || 1}
        onChange={value => setMaxMonthsPref(value)}
      />
      {reportBudgetEnabled && (
        <View style={{ marginLeft: -5 }}>
          <ButtonWithLoading
            ref={triggerRef}
            type="bare"
            loading={loading}
            style={{
              alignSelf: 'flex-start',
              padding: '4px 7px',
            }}
            title="Learn more about budgeting"
            onClick={() => setShowPopover(true)}
          >
            {budgetType === 'report' ? 'Report budget' : 'Rollover budget'}
          </ButtonWithLoading>

          <Popover
            triggerRef={triggerRef}
            placement="bottom start"
            isOpen={showPopover}
            onOpenChange={() => setShowPopover(false)}
            style={{
              padding: 10,
              maxWidth: 400,
            }}
          >
            <Paragraph>
              You are currently using a{' '}
              <Text style={{ fontWeight: 600 }}>
                {budgetType === 'report' ? 'Report budget' : 'Rollover budget'}.
              </Text>{' '}
              Switching will not lose any data and you can always switch back.
            </Paragraph>
            <Paragraph>
              <ButtonWithLoading
                type="primary"
                loading={loading}
                onClick={onSwitchType}
              >
                Switch to a{' '}
                {budgetType === 'report' ? 'Rollover budget' : 'Report budget'}
              </ButtonWithLoading>
            </Paragraph>
            <Paragraph isLast={true}>
              <Link
                variant="external"
                to="https://actualbudget.org/docs/experimental/report-budget"
                linkColor="muted"
              >
                How do these types of budgeting work?
              </Link>
            </Paragraph>
          </Popover>
        </View>
      )}
    </View>
  );
}

export const Titlebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useSidebar();
  const { isNarrowWidth } = useResponsive();
  const serverURL = useServerURL();
  const [floatingSidebar] = useGlobalPref('floatingSidebar');

  return isNarrowWidth ? null : (
    <div
      className="flex items-center h-[52px] px-4 gap-2 pointer-events-none [&_*]:pointer-events-auto"
      style={{
        // @ts-expect-error Unknown object key
        '-webkit-app-region': 'drag',
      }}
    >
      <div id="titlebar-outlet" />
      {/*<Routes>*/}
      {/*  <Route*/}
      {/*    path="/accounts"*/}
      {/*    element={*/}
      {/*      location.state?.goBack ? (*/}
      {/*        <Button type="bare" onClick={() => navigate(-1)}>*/}
      {/*          <SvgArrowLeft*/}
      {/*            width={10}*/}
      {/*            height={10}*/}
      {/*            style={{ marginRight: 5, color: 'currentColor' }}*/}
      {/*          />{' '}*/}
      {/*          Back*/}
      {/*        </Button>*/}
      {/*      ) : null*/}
      {/*    }*/}
      {/*  />*/}

      {/*  <Route path="/accounts/:id" element={<AccountSyncCheck />} />*/}

      {/*  <Route path="/budget" element={<BudgetTitlebar />} />*/}

      {/*  <Route path="*" element={null} />*/}
      {/*</Routes>*/}
      <div className="flex-1" />
      {/*<UncategorizedButton />*/}
      {/*<ThemeSelector style={{ marginLeft: 10 }} />*/}
      <PrivacyButton />
      {serverURL ? <SyncButton /> : null}
      <LoggedInUser />
    </div>
  );
};
