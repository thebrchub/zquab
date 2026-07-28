import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "1024944888869-9356nb9mq73ki2u2tch6ebtaoic7q3bg.apps.googleusercontent.com";

// 1. The Inner Form Component that handles the actual logic
function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 2. The Google Hook
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Send the access token to your backend via POST
        const response = await fetch('https://api.zquab.com/api/v1/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // ⚠️ CRITICAL: Required by your API docs to set the httpOnly cookies
          credentials: 'include', 
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Backend authentication failed');
        }

        // 3. Cookies are now successfully set by the backend. Navigate to the app.
        navigate('/home');

      } catch (error: any) {
        console.error(error);
        alert(`Failed to log in: ${error.message}`);
        setIsLoading(false);
      }
    },
    onError: () => {
      console.error('Google Login Popup Failed');
      alert('Google Login failed or was cancelled. Please try again.');
      setIsLoading(false);
    }
  });

  return (
    <div className="w-full max-w-md z-10 flex flex-col">
      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-8 sm:p-10 shadow-2xl w-full text-center relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            Welcome to zQuab
          </h1>
          <p className="text-[var(--text-muted)] text-base mt-3 leading-relaxed">
            Sign in or create an account in seconds to start adding friends and saving your chats.
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            handleGoogleLogin();
          }}
          disabled={isLoading}
          className="w-full py-4 bg-[var(--background)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <p className="text-xs text-[var(--text-muted)] mt-6">
          By continuing, you agree to our <a href="/terms" className="underline hover:text-[var(--text-main)]">Terms of Service</a> and <a href="/privacy" className="underline hover:text-[var(--text-main)]">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// 4. The Main Export wrapped in the OAuth Provider
export default function AuthPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-[calc(100dvh-80px)] flex flex-col justify-center items-center p-4 bg-[var(--background)] relative overflow-hidden">
        
        {/* Background ambient glow */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#3B82F6]/20 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <AuthForm />
        
      </div>
    </GoogleOAuthProvider>
  );
}