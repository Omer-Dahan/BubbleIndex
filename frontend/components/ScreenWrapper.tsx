'use client';
import { useAppShell } from './AppShell';
import type { ComponentType } from 'react';

interface ScreenWrapperProps {
  screen: ComponentType<any>;
  [extra: string]: any;
}

// Bridges shared shell state (data, palette, tweaks, ...) from context into a Screen
// component's existing props — keeps Screen components unaware of routing/context.
export default function ScreenWrapper({ screen: Screen, ...extra }: ScreenWrapperProps) {
  const shell = useAppShell();
  return <Screen {...shell} {...extra} />;
}
