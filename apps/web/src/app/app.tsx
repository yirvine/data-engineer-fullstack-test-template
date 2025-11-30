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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Event Simulator</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleFeatureClick}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
          >
            Simulate Feature Usage
          </button>

          <button
            onClick={handleGenerationFailure}
            className="w-full bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600"
          >
            Simulate Generation Failure
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
