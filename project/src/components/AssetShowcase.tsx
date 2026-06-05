import { Card } from '@components/ui/Card';
import { Image, Palette, FileJson } from 'lucide-react';
import reactSvg from '@assets/react.svg';
import sampleData from '@assets/sample-data.json';

export function AssetShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <Card className="p-6 flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <Image className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Public SVG
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Served from /public as a static asset
          </p>
          <img
            src="/vite.svg"
            alt="Vite logo"
            className="h-16 w-auto mx-auto"
          />
        </div>
      </Card>

      <Card className="p-6 flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <Palette className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Processed SVG
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Imported from src/assets with hash in production
          </p>
          <img
            src={reactSvg}
            alt="React logo"
            className="h-16 w-auto mx-auto animate-spin-slow"
          />
        </div>
      </Card>

      <Card className="p-6 flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <FileJson className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            JSON Data
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Imported and parsed at build time
          </p>
          <div className="text-sm font-mono text-slate-700 dark:text-slate-300 space-y-1">
            <div>users: {sampleData.users.length}</div>
            <div>version: {sampleData.version}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
