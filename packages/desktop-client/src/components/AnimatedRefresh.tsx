// @ts-strict-ignore
import React from 'react';

import { RefreshCwIcon } from 'lucide-react';

type AnimatedRefreshProps = {
  animating: boolean;
};

export function AnimatedRefresh({ animating }: AnimatedRefreshProps) {
  return (
    <RefreshCwIcon className={`w-4 h-4 ${animating ? 'animate-spin' : ''}`} />
  );
}
