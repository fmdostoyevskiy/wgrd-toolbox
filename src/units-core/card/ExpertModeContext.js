import { createContext, useContext } from 'react';

export const ExpertModeContext = createContext({ expert: false, toggleExpert: () => {} });
export function useExpertMode() { return useContext(ExpertModeContext); }
