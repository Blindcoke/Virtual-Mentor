'use client';

import { auth } from '@/lib/firebase/config';
import { createUserProfile } from '@/lib/firebase/firestore';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Phone number validation helper
const validatePhoneNumber = (phone: string): { valid: boolean; formatted: string; error?: string } => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check if it starts with +
  if (!cleaned.startsWith('+')) {
    return { valid: false, formatted: cleaned, error: 'Phone number must start with + and country code (e.g., +1 for US)' };
  }

  // Check minimum length (+ plus country code plus number)
  if (cleaned.length < 10) {
    return { valid: false, formatted: cleaned, error: 'Phone number is too short' };
  }

  return { valid: true, formatted: cleaned };
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaInitializing, setRecaptchaInitializing] = useState(true);

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    if (typeof window !== 'undefined') {
      const windowWithRecaptcha = window as typeof window & { recaptchaVerifier?: RecaptchaVerifier };

      // Clear existing verifier if any
      if (windowWithRecaptcha.recaptchaVerifier) {
        try {
          windowWithRecaptcha.recaptchaVerifier.clear();
        } catch (e) {
          console.log('Error clearing verifier:', e);
        }
      }

      try {
        console.log('🔧 Initializing reCAPTCHA...');
        windowWithRecaptcha.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved - user can send OTP
            console.log('✅ reCAPTCHA verified');
            setRecaptchaReady(true);
          },
          'expired-callback': () => {
            // reCAPTCHA expired
            console.log('⚠️ reCAPTCHA expired');
            setRecaptchaReady(false);
            setError('Security verification expired. Please try sending the code again.');
          },
          'error-callback': (error: Error) => {
            console.error('❌ reCAPTCHA error:', error);
            setRecaptchaReady(false);
            setError('Security verification failed. Please refresh the page and try again.');
          }
        });

        // Render the reCAPTCHA widget
        windowWithRecaptcha.recaptchaVerifier.render().then(() => {
          console.log('✅ reCAPTCHA widget rendered successfully');
          setRecaptchaReady(true);
          setRecaptchaInitializing(false);
        }).catch((error) => {
          console.error('❌ reCAPTCHA render error:', error);
          setRecaptchaInitializing(false);

          // Check for common errors
          if (error.code === 'auth/invalid-app-credential' || error.message?.includes('auth/invalid-app-credential')) {
            setError('Firebase Phone Authentication is not properly configured. Please ensure: 1) Phone sign-in is enabled in Firebase Console, 2) reCAPTCHA is configured, 3) Your domain is authorized.');
          } else if (error.message?.includes('reCAPTCHA')) {
            setError('Failed to load security verification. Please check your internet connection and try refreshing the page.');
          } else {
            setError('Failed to initialize security verification. Please refresh the page.');
          }
        });
      } catch (error) {
        console.error('❌ reCAPTCHA initialization error:', error);
        setRecaptchaInitializing(false);
        setError('Failed to initialize security verification. Please refresh the page.');
      }
    }

    return () => {
      const windowWithRecaptcha = window as typeof window & { recaptchaVerifier?: RecaptchaVerifier };
      if (windowWithRecaptcha.recaptchaVerifier) {
        try {
          windowWithRecaptcha.recaptchaVerifier.clear();
        } catch (e) {
          console.log('Error clearing verifier:', e);
        }
      }
      setRecaptchaReady(false);
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number format
      const validation = validatePhoneNumber(phone);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const windowWithRecaptcha = window as typeof window & { recaptchaVerifier?: RecaptchaVerifier };
      const appVerifier = windowWithRecaptcha.recaptchaVerifier;

      if (!appVerifier) {
        throw new Error('Security verification not initialized. Please refresh the page.');
      }

      if (!recaptchaReady) {
        throw new Error('Security verification is still loading. Please wait a moment and try again.');
      }

      console.log('📞 Attempting to send OTP to:', validation.formatted);
      console.log('🔐 App verifier ready:', !!appVerifier);

      const confirmation = await signInWithPhoneNumber(auth, validation.formatted, appVerifier);
      console.log('✅ OTP sent successfully');

      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err) {
      console.error('Error sending OTP:', err);
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please use international format: +1234567890 (+ followed by country code and number)');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later or use a different phone number.');
      } else if (error.code === 'auth/invalid-app-credential') {
        setError('Firebase Phone Authentication error. Please ensure: 1) Phone sign-in is enabled in Firebase Console, 2) Your domain is in the authorized domains list, 3) reCAPTCHA is properly configured.');
      } else if (error.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later or contact support.');
      } else if (error.code === 'auth/captcha-check-failed') {
        setError('Security verification failed. Please refresh the page and try again.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to send verification code. Please check your phone number and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result. Please request a new code.');
      }

      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit verification code.');
      }

      console.log('🔍 Verifying OTP...');
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      console.log('✅ OTP verified successfully');

      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        name,
        email: user.email || '',
        phone: user.phoneNumber || phone,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduleTime: '09:00',
      });

      console.log('✅ User profile created');
      router.push('/profile');
    } catch (err) {
      console.error('❌ Error verifying OTP:', err);
      const error = err as { code?: string; message?: string };

      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check the code and try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new code.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to verify code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Virtual Mentor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {step === 'info' ? 'Create your account' : 'Verify your phone'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {recaptchaInitializing && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Initializing security verification...</p>
            </div>
          )}

          {step === 'info' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="+1234567890"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Include country code (e.g., +1 for US, +44 for UK)
                </p>
              </div>

              {/* reCAPTCHA container - invisible but needs to exist */}
              <div id="recaptcha-container"></div>

              <button
                type="submit"
                disabled={loading || recaptchaInitializing}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                {loading ? 'Sending...' : recaptchaInitializing ? 'Loading...' : 'Send Verification Code'}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Or{' '}
                  <Link href="/auth/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    sign up with email
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We sent a 6-digit verification code to <span className="font-semibold">{phone}</span>
                </p>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('info');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                Change phone number
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
