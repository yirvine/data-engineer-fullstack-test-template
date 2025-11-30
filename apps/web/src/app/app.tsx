import { usePostHog } from 'posthog-js/react';

export function App() {
  const posthog = usePostHog();

  const handleFeatureClick = () => {
    posthog?.capture('feature_used');
  };

  const handleGenerationFailure = () => {
    // simulate a generation failure with training data
    posthog?.capture('generation_failed', {
      failure_reason: 'timeout',
      input_prompt: 'generate a marketing email for new users',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" style={{ fontFamily: 'Figtree, sans-serif' }}>
      <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Event Simulator</h1>
          <p className="text-slate-500 text-sm">track user interactions via posthog</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleFeatureClick}
            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Simulate Feature Usage
          </button>

          <button
            onClick={handleGenerationFailure}
            className="w-full bg-rose-600 text-white px-6 py-3.5 rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-sm"
          >
            Simulate Generation Failure
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            events are logged to training_data.jsonl
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
