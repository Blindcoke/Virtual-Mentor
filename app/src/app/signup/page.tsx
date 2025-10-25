'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile } from '@/lib/firebase/firestore';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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

      windowWithRecaptcha.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal', // Changed from 'invisible' to 'normal' for testing
        callback: () => {
          // reCAPTCHA solved - user can send OTP
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          // reCAPTCHA expired
          console.log('reCAPTCHA expired');
        }
      });
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
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const windowWithRecaptcha = window as typeof window & { recaptchaVerifier?: RecaptchaVerifier };
      const appVerifier = windowWithRecaptcha.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA verifier not initialized');
      }

      console.log('📞 Attempting to send OTP to:', phone);
      console.log('🔐 App verifier:', appVerifier);

      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);

      console.log('✅ OTP sent successfully');
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err) {
      console.error('❌ Error sending OTP:', err);
      const error = err as { code?: string; message?: string };

      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please use format: +1234567890');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-app-credential') {
        setError('Firebase configuration error. Please check: 1) Phone auth is enabled, 2) Web app is registered in Firebase, 3) Try using a test phone number in Firebase Console.');
      } else {
        setError(`Failed to send OTP: ${error.message || 'Please try again.'}`);
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
        throw new Error('No confirmation result');
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        name,
        email: user.email || '',
        phone: user.phoneNumber || phone,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduleTime: '09:00',
      });

      router.push('/profile');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      const error = err as { code?: string };
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please try again.');
      } else {
        setError('Failed to verify OTP. Please try again.');
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
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* reCAPTCHA will appear here */}
              <div id="recaptcha-container" className="flex justify-center"></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                {loading ? 'Sending...' : 'Send OTP'}
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
                  We sent a verification code to <span className="font-semibold">{phone}</span>
                </p>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
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
