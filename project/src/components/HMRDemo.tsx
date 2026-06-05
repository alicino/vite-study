import { useCounter } from '@hooks/useCounter';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { RefreshCw, Minus, Plus } from 'lucide-react';

export function HMRDemo() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <Card className="w-full">
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Hot Module Replacement Demo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Edit this file while the dev server is running. Vite will update the
            UI instantly without losing the counter state.
          </p>
        </div>

        <div className="text-7xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
          {count}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={decrement}
            aria-label="Decrement"
          >
            <Minus className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={increment}
            aria-label="Increment"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            onClick={reset}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          Try changing the heading text above — the count will stay the same.
        </p>
      </div>
    </Card>
  );
}
