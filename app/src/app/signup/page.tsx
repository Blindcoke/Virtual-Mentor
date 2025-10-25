'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase/config';
import { createUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Image from 'next/image';
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
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
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

      // Check if user profile already exists
      const existingProfile = await getUserProfile(user.uid);

      if (existingProfile) {
        // User exists, redirect to profile (login)
        console.log('✅ Existing user, logging in');
        router.push('/profile');
      } else {
        // New user, show name collection step
        console.log('📝 New user, showing name step');
        setStep('name');
      }
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

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user found. Please try logging in again.');
      }

      if (!name.trim()) {
        throw new Error('Please enter your full name.');
      }

      console.log('📝 Creating user profile...');

      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        name: name.trim(),
        email: user.email || '',
        phone: user.phoneNumber || phone,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduleTime: '09:00',
      });

      console.log('✅ User profile created');
      router.push('/profile');
    } catch (err) {
      console.error('❌ Error creating profile:', err);
      const error = err as { code?: string; message?: string };

      if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to create profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8" style={{ backgroundColor: '#FFF9F4' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/rise.png"
            alt="Rise Logo"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Login or Create an account</h2>
            <p className="text-sm text-muted-foreground">
              {step === 'phone' ? 'Enter your phone number' : step === 'otp' ? 'Verify your phone' : 'Complete your profile'}
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

   

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>

                {/* reCAPTCHA container - invisible but needs to exist */}
                <div id="recaptcha-container"></div>

                <Button
                  type="submit"
                  disabled={loading || recaptchaInitializing}
                  className="w-full"
                >
                  {loading ? 'Sending...' : recaptchaInitializing ? 'Loading...' : 'Send Verification Code'}
                </Button>

              </form>
            ) : step === 'otp' ? (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit verification code to <span className="font-semibold">{phone}</span>
                  </p>
                  <label htmlFor="otp" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="text-center text-2xl tracking-widest" 
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full"
                >
                  Change phone number
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCreateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating account...' : 'Continue'}
                </Button>
              </form>
            )}

           
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
