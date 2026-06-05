import { Card } from '@components/ui/Card';
import { Settings, Globe, Calendar, Hash } from 'lucide-react';

interface EnvVar {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function EnvInfo() {
  const envVars: EnvVar[] = [
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'VITE_APP_NAME',
      value: import.meta.env.VITE_APP_NAME ?? 'not set',
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: 'VITE_API_URL',
      value: import.meta.env.VITE_API_URL ?? 'not set',
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: 'VITE_BUILD_DATE',
      value: import.meta.env.VITE_BUILD_DATE ?? 'not set',
    },
    {
      icon: <Hash className="w-4 h-4" />,
      label: 'MODE',
      value: import.meta.env.MODE,
    },
  ];

  return (
    <Card className="w-full">
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Environment Variables
        </h2>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {envVars.map((env) => (
            <div
              key={env.label}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="text-slate-500 dark:text-slate-400">
                {env.icon}
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {env.label}
                </span>
                <code className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 truncate">
                  {env.value}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
