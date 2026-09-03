import { useState } from 'react';

export function useOrganizationalUnits() {
  const [units, setUnits] = useState<string[]>([]);

  const addUnit = (name: string) => {
    setUnits((previous) => [...previous, name]);
  };

  return { units, addUnit };
}
