// Flight keeps semantic text in the terminal foreground. Only the artwork and pointers use lilac.
import { RGBA } from '@opentui/core';

export const FOREGROUND = RGBA.defaultForeground();
export const ACCENT = '#ad77ef';
export const RULE = '#624c7d';

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
  selectedBackgroundColor: 'transparent',
  textColor: FOREGROUND,
  focusedTextColor: FOREGROUND,
  selectedTextColor: FOREGROUND,
  descriptionColor: FOREGROUND,
  selectedDescriptionColor: FOREGROUND,
} as const;
