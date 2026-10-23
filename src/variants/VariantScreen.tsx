// Lazy-loaded entry for every design variant screen (kept out of the main bundle).
import type { ComponentType } from 'react';
import { type Screen, type VariantId } from './registry';
import { VariantFrame } from './shared/VariantFrame';
import * as V1 from './v1';
import * as V2 from './v2';
import * as V3 from './v3';
import * as V4 from './v4';
import * as V5 from './v5';

type VariantModule = { Landing: ComponentType; Results: ComponentType; Investor: ComponentType };

const MODULES: Record<VariantId, VariantModule> = { v1: V1, v2: V2, v3: V3, v4: V4, v5: V5 };
const SCREEN_KEY = { landing: 'Landing', results: 'Results', investor: 'Investor' } as const;

export default function VariantScreen({ variant, screen }: { variant: VariantId; screen: Screen }) {
  const Page = MODULES[variant][SCREEN_KEY[screen]];
  return (
    <VariantFrame variant={variant} screen={screen}>
      <Page />
    </VariantFrame>
  );
}
