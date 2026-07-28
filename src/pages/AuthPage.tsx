import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "1024944888869-9356nb9mq73ki2u2tch6ebtaoic7q3bg.apps.googleusercontent.com";

function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      // ⚠️ Notice we are now sending credentialResponse.credential (The ID Token) 
      // instead of the access_token
      const response = await fetch('https://api.zquab.com/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backend authentication failed');
      }

      navigate('/home');

    } catch (error: any) {
      console.error(error);
      alert(`Failed to log in: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* 🛠️ We replace the custom button with the official Google Login component */}
        <div className="flex justify-center w-full relative min-h-[44px]">
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-4 bg-[var(--background)] border border-[var(--border-color)] rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.error('Google Login Failed');
                alert('Google Login failed. Please try again.');
              }}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              width="300"
            />
          )}
        </div>
        
        <p className="text-xs text-[var(--text-muted)] mt-6">
          By continuing, you agree to our <a href="/terms" className="underline hover:text-[var(--text-main)]">Terms of Service</a> and <a href="/privacy" className="underline hover:text-[var(--text-main)]">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

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