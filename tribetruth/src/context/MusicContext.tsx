import { createContext } from 'react';

type MusicContextValue = {
  isMuted: boolean;
  setMuted: (value: boolean) => void;
  toggleMuted: () => void;
  isThemeSuppressed: boolean;
  setThemeSuppressed: (value: boolean) => void;
};

const MusicContext = createContext<MusicContextValue>({
  isMuted: false,
  setMuted: () => undefined,
  toggleMuted: () => undefined,
  isThemeSuppressed: false,
  setThemeSuppressed: () => undefined,
});

export type { MusicContextValue };
export default MusicContext;
