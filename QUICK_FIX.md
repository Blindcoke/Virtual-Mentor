# 🔥 QUICK FIX: Phone OTP Not Working

## The Problem
Getting this error?
```
❌ Error sending OTP: FirebaseError: Firebase: Error (auth/invalid-app-credential).
```

## The Solution (3 Steps)

### Step 1: Add `127.0.0.1` to Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project: `virtual-mentor-2e4d0`
3. Click **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Type: `127.0.0.1`
6. Click **Save**

### Step 2: Enable Phone Authentication
1. Same Firebase Console page
2. Click **Sign-in method** (top tab)
3. Find **Phone** in the list
4. Click it → Toggle **Enable** → **Save**

### Step 3: Test It
1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Open in browser** (use 127.0.0.1, NOT localhost):
   ```
   http://127.0.0.1:3000/signup
   ```

3. **Try the OTP flow**:
   - Enter your name
   - Enter phone with country code: `+15555550100` (test number) or `+1234567890` (real)
   - Click "Send Verification Code"
   - ✅ Should work now!

## Why Does This Fix Work?

Firebase changed their phone auth security in 2024/2025:
- ❌ `localhost` no longer works for phone authentication
- ✅ `127.0.0.1` is required for reCAPTCHA verification

The app has been updated to run on `127.0.0.1` automatically when you use `npm run dev`.

## Optional: Set Up Test Phone Number (Recommended)

To test without using real phone numbers:

1. Firebase Console → Authentication → Sign-in method
2. Scroll to **"Phone numbers for testing"**
3. Click **"Add phone number"**
4. Add:
   - Phone: `+15555550100`
   - Code: `123456`
5. Save

Now you can test instantly without waiting for SMS!

## Still Having Issues?

Check the detailed guide: [FIREBASE_PHONE_AUTH_SETUP.md](./FIREBASE_PHONE_AUTH_SETUP.md)

## What Was Fixed in the Code

✅ Changed reCAPTCHA from 'normal' to 'invisible'
✅ Added phone number validation (requires + and country code)
✅ Added proper error handling for 10+ error types
✅ Added loading states and user feedback
✅ Updated dev server to use 127.0.0.1
✅ Added detailed console logging for debugging

All code changes are in: `app/src/app/signup/page.tsx`
