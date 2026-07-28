import type { ComponentType } from 'react';

import { PetListPage } from './features/pets/PetListPage/PetListPage';
import { PetListPage as PetListPageEffect } from './features/pets/PetListPage/PetListPage1';
import { PetListPage as PetListPageRedux } from './features/pets/PetListPage/PetListPage2';
import { PetListPage as PetListPageQuery } from './features/pets/PetListPage/PetListPage3';

/**
 * Demo scaffolding for the TanStack Query enablement session: `?step=1..4` swaps
 * between the four generations of the same screen so they can be compared live
 * without editing imports mid-talk. Default (no param) is what the app ships.
 */
const DEMO_STEPS: Record<string, { label: string; Page: ComponentType }> = {
  '1': { label: 'useEffect', Page: PetListPageEffect },
  '2': { label: 'Redux', Page: PetListPageRedux },
  '3': { label: 'Query', Page: PetListPageQuery },
  '4': { label: 'orval', Page: PetListPage },
};

function StepSwitcher({ current }: { current: string }) {
  return (
    <nav
      aria-label='Demo step'
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        padding: '6px 10px',
        marginBottom: 12,
        borderBottom: '1px solid #d9d9d9',
        fontFamily: 'Cascadia Code, Consolas, monospace',
        fontSize: 12,
      }}
    >
      {Object.entries(DEMO_STEPS).map(([step, { label }]) => (
        <a
          key={step}
          href={`?step=${step}`}
          aria-current={step === current ? 'page' : undefined}
          style={{
            padding: '3px 9px',
            borderRadius: 4,
            textDecoration: 'none',
            border: '1px solid #d9d9d9',
            fontWeight: step === current ? 700 : 400,
            color: step === current ? '#ff4154' : 'inherit',
            borderColor: step === current ? '#ff4154' : '#d9d9d9',
          }}
        >
          {step} · {label}
        </a>
      ))}
    </nav>
  );
}

export default function App() {
  const step = new URLSearchParams(window.location.search).get('step') ?? '';
  const demo = DEMO_STEPS[step];

  if (import.meta.env.DEV && demo) {
    const { Page } = demo;
    return (
      <>
        <StepSwitcher current={step} />
        <Page />
      </>
    );
  }

  return <PetListPage />;
}
