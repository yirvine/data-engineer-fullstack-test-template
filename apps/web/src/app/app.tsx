import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

export function App() {
  const posthog = usePostHog();
  const [featureCount, setFeatureCount] = useState(() => {
    const stored = localStorage.getItem('featureCount');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lastClicked, setLastClicked] = useState<'feature' | 'generation' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [promptInput, setPromptInput] = useState('');

  // Check for existing email and identify user when app loads
  useEffect(() => {
    if (posthog) {
      // Get or create a persistent user ID
      let id = localStorage.getItem('userId');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('userId', id);
      }
      setUserId(id);

      // Check for existing email
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setUserEmail(storedEmail);
        posthog.identify(id, { email: storedEmail });
      } else {
        // Show modal to collect email
        setShowEmailModal(true);
        posthog.identify(id);
      }
    }
  }, [posthog]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() && userId) {
      const email = emailInput.trim();
      localStorage.setItem('userEmail', email);
      setUserEmail(email);
      setShowEmailModal(false);
      
      // Update PostHog person with email property
      posthog?.identify(userId, { email });
    }
  };

  const handleFeatureClick = () => {
    const newCount = featureCount + 1;
    setFeatureCount(newCount);
    localStorage.setItem('featureCount', String(newCount));
    
    // Frontend reports the count, PostHog decides what to do with it
    posthog?.capture('feature_used', {
      total_usage_count: newCount
    });
    
    setLastClicked('feature');
    setTimeout(() => setLastClicked(null), 300);
    console.log(`feature_used event sent (count: ${newCount})`);
  };

  const handleGenerationFailure = () => {
    const prompt = promptInput.trim() || 'user inputs a prompt';
    posthog?.capture('generation_failed', {
      failure_reason: 'timeout',
      input_prompt: prompt,
    });
    setLastClicked('generation');
    setTimeout(() => setLastClicked(null), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" style={{ fontFamily: 'Figtree, sans-serif' }}>
      {/* Email Collection Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Enter your email to receive notifications when you hit milestones.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="w-full text-slate-500 py-2 mt-2 text-sm hover:text-slate-700 transition-colors"
              >
                Skip for now
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
        {userId && (
          <div className="mb-6 pb-4 border-b border-slate-200">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Identified User</p>
            {userEmail && (
              <p className="text-sm font-medium text-slate-700 mb-1">{userEmail}</p>
            )}
            <p className="text-xs font-mono text-slate-400 break-all">
              {userId}
            </p>
          </div>
        )}
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">PostHog Event Simulator</h1>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleFeatureClick}
            className={`w-full bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium shadow-sm ${
              lastClicked === 'feature' ? 'ring-4 ring-blue-300' : ''
            }`}
          >
            Simulate Feature Usage
            {featureCount > 0 && (
              <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {featureCount}
              </span>
            )}
          </button>

          <div className="pt-2">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Enter a prompt to simulate..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm mb-2"
            />
            <button
              onClick={handleGenerationFailure}
              className={`w-full bg-rose-600 text-white px-6 py-3.5 rounded-lg hover:bg-rose-700 active:scale-95 transition-all font-medium shadow-sm ${
                lastClicked === 'generation' ? 'ring-4 ring-rose-300' : ''
              }`}
            >
              Simulate Generation Failure
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          {featureCount >= 5 && (
            <p className="text-xs text-green-600 text-center mt-2 font-medium">
              Check your email!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
