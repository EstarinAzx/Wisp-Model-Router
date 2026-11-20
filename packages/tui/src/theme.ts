// Opaque color is reserved for the active choice, with a contrasting text color.
import { createContext, useContext } from 'react';
import { RGBA } from '@opentui/core';

export const FOREGROUND = RGBA.defaultForeground();
export const ACCENT = '#ad77ef';
export const RULE = '#80659b';
export const SELECTION = '#3e2d52';
export const SELECTED_TEXT = '#f3e8ff';

export const tuiInk = {
  dark: { heading: '#f1edf3', value: '#cfb0fa', note: '#b0abb6', live: '#84cba3' },
  light: { heading: '#29232e', value: '#61398b', note: '#574e60', live: '#235f40' },
};

export const TuiInkContext = createContext(tuiInk.dark);
export const useTuiInk = () => useContext(TuiInkContext);

export const commandFrameFits = (columns: number, rows: number) => columns >= 50 && rows >= 22;

export const INPUT_COLORS = {
  backgroundColor: 'transparent',
  focusedBackgroundColor: 'transparent',
  textColor: FOREGROUND,
  focusedTextColor: FOREGROUND,
  placeholderColor: FOREGROUND,
} as const;

export const SELECT_COLORS = {
  backgroundColor: 'transparent',
  focusedBackgroundColor: 'transparent',
  selectedBackgroundColor: SELECTION,
  textColor: FOREGROUND,
  focusedTextColor: FOREGROUND,
  selectedTextColor: SELECTED_TEXT,
  descriptionColor: FOREGROUND,
  selectedDescriptionColor: SELECTED_TEXT,
} as const;
