import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { buildDirectory, type Directory } from '@/domain/directory';

import { createJsonRepositories } from './json/jsonRepositories';
import { loadDataset, type Repositories } from './repositories';
import { createStressRepositories } from './stressRepositories';

export type DatasetName = 'sample' | 'stress';

type DirectoryState =
  | { status: 'loading' }
  | { status: 'ready'; directory: Directory }
  | { status: 'error'; message: string };

interface DirectoryContextValue {
  state: DirectoryState;
  dataset: DatasetName;
  setDataset: (name: DatasetName) => void;
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null);

function repositoriesFor(name: DatasetName): Repositories {
  const json = createJsonRepositories();
  return name === 'stress' ? createStressRepositories(json) : json;
}

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<DatasetName>('sample');
  const [state, setState] = useState<DirectoryState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadDataset(repositoriesFor(dataset))
      .then((data) => !cancelled && setState({ status: 'ready', directory: buildDirectory(data) }))
      .catch(
        (e: unknown) =>
          !cancelled &&
          setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      cancelled = true;
    };
  }, [dataset]);

  const value = useMemo(
    () => ({
      state,
      dataset,
      setDataset: (name: DatasetName) => {
        setState({ status: 'loading' });
        setDataset(name);
      },
    }),
    [state, dataset],
  );
  return <DirectoryContext value={value}>{children}</DirectoryContext>;
}

export function useDirectoryContext(): DirectoryContextValue {
  const ctx = use(DirectoryContext);
  if (!ctx) throw new Error('useDirectoryContext must be used inside DirectoryProvider');
  return ctx;
}

/** The loaded directory, or null while loading or on error. */
export function useDirectory(): Directory | null {
  const { state } = useDirectoryContext();
  return state.status === 'ready' ? state.directory : null;
}
