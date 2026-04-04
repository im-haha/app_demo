import {lazy} from 'react';

export type WebTabKey = 'home' | 'bills' | 'mine';

type ModuleLoader<TModule> = () => Promise<TModule>;

const loadedKeys = new Set<string>();

function preloadOnce<TModule>(key: string, loader: ModuleLoader<TModule>): void {
  if (loadedKeys.has(key)) {
    return;
  }

  loadedKeys.add(key);
  void loader();
}

function runWhenIdle(task: () => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => task(), {timeout: 1200});
    return;
  }

  window.setTimeout(task, 240);
}

export const loadAuthPanel = () => import('./AuthPanel');
export const loadHomePanel = () => import('./HomePanel');
export const loadBillsPanel = () => import('./BillsPanel');
export const loadMinePanel = () => import('./MinePanel');

export const AuthPanelLazy = lazy(loadAuthPanel);
export const HomePanelLazy = lazy(loadHomePanel);
export const BillsPanelLazy = lazy(loadBillsPanel);
export const MinePanelLazy = lazy(loadMinePanel);

export function prefetchUnauthedRoutes(): void {
  runWhenIdle(() => preloadOnce('auth', loadAuthPanel));
}

export function prefetchByTabIntent(tab: WebTabKey): void {
  if (tab === 'home') {
    preloadOnce('home', loadHomePanel);
    return;
  }

  if (tab === 'bills') {
    preloadOnce('bills', loadBillsPanel);
    return;
  }

  preloadOnce('mine', loadMinePanel);
}

export function prefetchAuthedRoutes(activeTab: WebTabKey): void {
  runWhenIdle(() => {
    preloadOnce('home', loadHomePanel);
    preloadOnce('bills', loadBillsPanel);
    preloadOnce('mine', loadMinePanel);

    // Secondary warmup for current tab to reduce first interaction latency.
    prefetchByTabIntent(activeTab);
  });
}
