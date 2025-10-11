import { useState } from "react";

/**
 * Custom hook for managing multi-select toggles
 */
export const useToggleSelection = (initialSelection: string[] = []) => {
  const [selected, setSelected] = useState<string[]>(initialSelection);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const isSelected = (id: string) => selected.includes(id);

  const clear = () => setSelected([]);

  const selectAll = (ids: string[]) => setSelected(ids);

  return {
    selected,
    toggle,
    isSelected,
    clear,
    selectAll,
    setSelected,
  };
};
