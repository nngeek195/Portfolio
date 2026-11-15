import { FX_INLINE } from '@/lib/fx-inline';

// Applies the saved FX: LITE choice to <html> before first paint (no FULL flash for LITE visitors).
export default function FxInit() {
  return <script dangerouslySetInnerHTML={{ __html: FX_INLINE }} />;
}
