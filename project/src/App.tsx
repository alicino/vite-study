import { Zap, Github } from "lucide-react";
import { HMRDemo } from "@components/HMRDemo";
import { AssetShowcase } from "@components/AssetShowcase";
import { EnvInfo } from "@components/EnvInfo";
import { Card } from "@components/ui/Card";

function App() {
  const appName = import.meta.env.VITE_APP_NAME ?? "Vite Study Project";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{appName}</h1>
              <p className="text-sm text-gray-500">
                A hands-on Vite learning environment
              </p>
            </div>
          </div>
          <a
            href="https://github.com/vitejs/vite"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Github</span>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HMRDemo />
          <AssetShowcase />
          <EnvInfo />
          <Card title="Next Steps">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Edit components and watch HMR update instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Run the production build and inspect output</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Add dynamic imports for code splitting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Configure the legacy plugin for older browsers</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Built with ⚡ Vite + React + TypeScript + Tailwind CSS
        </div>
      </footer>
    </div>
  );
}

export default App;
