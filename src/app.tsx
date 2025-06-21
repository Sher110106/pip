import { useState, useCallback } from "react";
import {
  parseRequirementString,
  type ResolutionRequest,
  type DependencyReport,
} from "./shared";

// Import new sections
import HeroSection from "./components/home/hero-section";
import GitHubIntegrationSection from "./components/home/github-integration-section";
import LiveDemoSection from "./components/home/live-demo-section";
import BenefitsSection from "./components/home/benefits-section";

// Add custom CSS animations
const customStyles = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
  
  .bg-300\\% {
    background-size: 300% 300%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

interface DependencyInputProps {
  onSubmit: (request: ResolutionRequest) => void;
  isProcessing: boolean;
}

function DependencyInput({ onSubmit, isProcessing }: DependencyInputProps) {
  const [requirements, setRequirements] = useState(
    "numpy>=1.19.0\npandas>=1.3.0\ndjango==3.2.5"
  );
  const [pythonVersion, setPythonVersion] = useState("3.9");
  const [allowPrereleases, setAllowPrereleases] = useState(false);
  const [excludeDeprecated, setExcludeDeprecated] = useState(true);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const parsedRequirements = requirements
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => parseRequirementString(line));

        const request: ResolutionRequest = {
          requirements: parsedRequirements,
          python_version: pythonVersion,
          allow_prereleases: allowPrereleases,
          prefer_stable: true,
          exclude_deprecated: excludeDeprecated,
          suggest_alternatives: true,
        };

        onSubmit(request);
      } catch (error) {
        alert(
          `Error parsing requirements: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
    [requirements, pythonVersion, allowPrereleases, excludeDeprecated, onSubmit]
  );

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 px-8 py-6 border-b border-gray-700/50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-3xl">🐍</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Try It Yourself
          </h2>
          <p className="text-gray-300 text-lg">
            Experience the full power of our dependency resolver
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-semibold text-white mb-3"
            >
              📦 Requirements (one per line)
            </label>
            <textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full h-40 p-4 border-2 border-gray-600 rounded-xl resize-none font-mono text-sm text-gray-200 bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-gray-700 transition-all duration-200"
              placeholder="numpy>=1.19.0&#10;pandas>=1.3.0&#10;django==3.2.5"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-400 mt-2 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Supports pip requirement format (e.g., package&gt;=1.0.0, package==2.1.3)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="python-version"
                className="block text-sm font-semibold text-white mb-2"
              >
                🐍 Python Version
              </label>
              <select
                id="python-version"
                value={pythonVersion}
                onChange={(e) => setPythonVersion(e.target.value)}
                className="w-full p-3 border-2 border-gray-600 rounded-xl text-gray-200 bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                disabled={isProcessing}
              >
                <option value="3.8">Python 3.8</option>
                <option value="3.9">Python 3.9</option>
                <option value="3.10">Python 3.10</option>
                <option value="3.11">Python 3.11</option>
                <option value="3.12">Python 3.12</option>
              </select>
            </div>

            <div className="flex items-center justify-center">
              <label className="flex items-center cursor-pointer bg-gray-800/50 rounded-xl p-3 hover:bg-gray-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={allowPrereleases}
                  onChange={(e) => setAllowPrereleases(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isProcessing}
                />
                <span className="ml-3 text-sm font-medium text-white">
                  🧪 Allow prereleases
                </span>
              </label>
            </div>

            <div className="flex items-center justify-center">
              <label className="flex items-center cursor-pointer bg-gray-800/50 rounded-xl p-3 hover:bg-gray-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={excludeDeprecated}
                  onChange={(e) => setExcludeDeprecated(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isProcessing}
                />
                <span className="ml-3 text-sm font-medium text-white">
                  ⚠️ Exclude deprecated
                </span>
              </label>
            </div>

            <div className="flex items-center">
              <button
                type="submit"
                disabled={isProcessing || !requirements.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resolving...
                  </span>
                ) : (
                  "🔍 Resolve Dependencies"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResolutionResultsProps {
  report: DependencyReport | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function ResolutionResults({
  report,
  isLoading,
  error,
  onRetry,
}: ResolutionResultsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "requirements" | "details"
  >("overview");

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 px-8 py-6 border-b border-gray-700/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Analyzing Dependencies</h3>
            <p className="text-blue-200">Our AI is working hard to resolve your packages...</p>
          </div>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 px-8 py-6 border-b border-red-500/30">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Analysis Failed</h3>
            <p className="text-red-200">Something went wrong during analysis</p>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 mb-6">
            <p className="text-red-200 font-mono text-sm">{error}</p>
          </div>
          <div className="text-center">
            <button
              onClick={onRetry}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-8 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 px-8 py-6 border-b border-gray-700/50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Analysis Complete</h3>
          <p className="text-green-200">Your dependency analysis is ready</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700/50">
        <nav className="flex space-x-8 px-8">
          {[
            { key: "overview", label: "📊 Overview", icon: "📊" },
            { key: "requirements", label: "📄 Requirements", icon: "📄" },
            { key: "details", label: "📋 Details", icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-300"
                  : "border-transparent text-gray-200 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {report.result.resolved_packages?.length || 0}
                </div>
                <div className="text-green-200 text-sm">Resolved Packages</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {report.result.deprecated_packages?.length || 0}
                </div>
                <div className="text-yellow-200 text-sm">Deprecated Packages</div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {report.result.conflicts?.length || 0}
                </div>
                <div className="text-red-200 text-sm">Conflicts</div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {report.metadata?.processing_time_ms || 0}ms
                </div>
                <div className="text-blue-200 text-sm">Processing Time</div>
              </div>
            </div>

            {/* Resolved Packages */}
            {report.result.resolved_packages && report.result.resolved_packages.length > 0 && (
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="mr-2">✅</span>
                  Resolved Packages ({report.result.resolved_packages.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.result.resolved_packages.map((pkg: { name: string; version: string }, index: number) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4"
                    >
                      <div className="font-mono text-green-400 font-medium">
                        {pkg.name}
                      </div>
                      <div className="text-white text-sm">
                        Version: <span className="text-blue-400">{pkg.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deprecated Packages */}
            {report.result.deprecated_packages && report.result.deprecated_packages.length > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Deprecated Packages ({report.result.deprecated_packages.length})
                </h4>
                <div className="space-y-4">
                  {report.result.deprecated_packages.map((pkg: { name: string; version: string; reason: string; suggested_alternative?: string }, index: number) => (
                    <div
                      key={index}
                      className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-yellow-400 font-medium">
                          {pkg.name}
                        </span>
                        <span className="text-yellow-200 text-sm">{pkg.version}</span>
                      </div>
                      <p className="text-white text-sm mb-2">{pkg.reason}</p>
                      {pkg.suggested_alternative && (
                        <div className="text-sm">
                          <span className="text-blue-400">💡 Alternative: </span>
                          <span className="text-white">
                            {pkg.suggested_alternative}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "requirements" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">📄</span>
                Requirements.txt
              </h4>
              <button
                onClick={() => navigator.clipboard.writeText(report.requirements_txt)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📋 Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700/50">
              <div className="bg-gray-800 px-4 py-2 flex items-center border-b border-gray-700/50">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-white text-sm font-mono">requirements.txt</span>
              </div>
              <pre className="text-green-400 p-6 overflow-x-auto text-sm font-mono leading-relaxed">
                {report.requirements_txt}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div>
            <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-2">📋</span>
              Detailed Analysis Report
            </h4>
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
              <div
                className="prose max-w-none text-white"
                dangerouslySetInnerHTML={{
                  __html: report.detailed_report
                    .replace(/\n/g, "<br/>")
                    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>")
                    .replace(/\*(.+?)\*/g, "<em class='text-gray-300'>$1</em>")
                    .replace(/#{1,6}\s(.+)/g, "<h3 class='text-lg font-semibold text-white mt-4 mb-2'>$1</h3>"),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700/50 px-8 py-4 bg-gray-800/30">
        <div className="flex flex-wrap justify-between items-center text-sm text-gray-200">
          <span className="flex items-center">
            <span className="mr-1">🐍</span>
            Python {report.metadata.python_version}
          </span>
          <span className="flex items-center">
            <span className="mr-1">⚡</span>
            Processed in {report.metadata.processing_time_ms}ms
          </span>
          <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
            ID: {report.id}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentReport, setCurrentReport] = useState<DependencyReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<ResolutionRequest | null>(null);

  // Handle dependency resolution with correct URL
  const handleResolutionRequest = useCallback(
    async (request: ResolutionRequest) => {
      setIsProcessing(true);
      setError(null);
      setCurrentReport(null);
      setLastRequest(request);

      try {
        // Submit resolution request using correct kebab-case URL
        const response = await fetch(
          "/agents/dependency-resolver-agent/resolve",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          }
        );

        if (!response.ok) {
          throw new Error(`Resolution request failed: ${response.statusText}`);
        }

        const result = (await response.json()) as {
          id: string;
          status: string;
          message: string;
        };

        // Poll for results with correct URL pattern
        const pollForResults = async () => {
          try {
            const statusResponse = await fetch(
              `/agents/dependency-resolver-agent/status?id=${result.id}`
            );
            
            if (!statusResponse.ok) {
              throw new Error("Failed to check status");
            }

            const statusData = (await statusResponse.json()) as any;

            if ("error" in statusData) {
              setError(statusData.error as string);
              setIsProcessing(false);
            } else if ("result" in statusData) {
              setCurrentReport(statusData as DependencyReport);
              setIsProcessing(false);
            } else {
              // Still processing, continue polling
              setTimeout(pollForResults, 2000);
            }
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Unknown error occurred"
            );
            setIsProcessing(false);
          }
        };

        // Start polling after a short delay
        setTimeout(pollForResults, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setIsProcessing(false);
      }
    },
    []
  );

  // Retry function
  const handleRetry = useCallback(() => {
    if (lastRequest) {
      handleResolutionRequest(lastRequest);
    }
  }, [lastRequest, handleResolutionRequest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      {/* Hero Section */}
      <HeroSection />

      {/* GitHub Integration Section */}
      <GitHubIntegrationSection />

      {/* Live Demo Section */}
      <LiveDemoSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Interactive Demo Section */}
      <div id="demo-section" className="py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl mb-8">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Full Featured Demo
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Use the complete dependency resolver with all features, real AI analysis, 
              <br className="hidden lg:block" />
              and <span className="text-orange-600">detailed reporting</span>
            </p>
          </div>

          <div className="space-y-16">
            <DependencyInput
              onSubmit={handleResolutionRequest}
              isProcessing={isProcessing}
            />

            <ResolutionResults
              report={currentReport}
              isLoading={isProcessing}
              error={error}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-t border-emerald-200">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-emerald-300">
                <span className="text-4xl">🐍</span>
              </div>
            </div>
            <h3 className="text-4xl font-bold text-gray-800 mb-6">
              Ready to Transform Your 
              <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                Development Workflow?
              </span>
            </h3>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Join thousands of developers who trust our AI-powered dependency analysis platform
              <br className="hidden lg:block" />
              <span className="text-emerald-600">Start analyzing today</span> – it's completely free to get started
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 text-lg">
                <span className="relative z-10 flex items-center gap-3">
                  <span>🚀</span>
                  Get Started Free
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Additional Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-2xl p-6 hover:border-emerald-300 transition-all duration-300">
                <div className="text-3xl mb-4">📈</div>
                <h4 className="text-gray-800 font-bold mb-2">Enterprise Ready</h4>
                <p className="text-gray-600 text-sm">Scale to thousands of repositories with team management and enterprise integrations</p>
              </div>
              <div className="bg-white/80 backdrop-blur-lg border border-teal-200 rounded-2xl p-6 hover:border-teal-300 transition-all duration-300">
                <div className="text-3xl mb-4">🔌</div>
                <h4 className="text-gray-800 font-bold mb-2">Easy Integration</h4>
                <p className="text-gray-600 text-sm">Works with your existing tools: GitHub, GitLab, CI/CD pipelines, and more</p>
              </div>
              <div className="bg-white/80 backdrop-blur-lg border border-green-200 rounded-2xl p-6 hover:border-green-300 transition-all duration-300">
                <div className="text-3xl mb-4">⚡</div>
                <h4 className="text-gray-800 font-bold mb-2">Lightning Fast</h4>
                <p className="text-gray-600 text-sm">Get results in milliseconds with our global edge computing infrastructure</p>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-emerald-200 text-gray-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-sm">
                <span className="text-emerald-600">Powered by AI</span> • Built with ❤️ for Python developers • 
                <span className="text-teal-600">Deployed on Cloudflare Workers</span>
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 transition-colors">Documentation</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
