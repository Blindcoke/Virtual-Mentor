# Firebase Phone Authentication Setup Guide

This guide will help you configure Firebase Phone Authentication for your Virtual Mentor app.

## 🚀 Quick Fix for "auth/invalid-app-credential" Error

If you're getting `auth/invalid-app-credential` errors:

1. **Add `127.0.0.1` to Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Authentication → Settings → Authorized domains
   - Click "Add domain" → Enter `127.0.0.1` → Save

2. **Restart your dev server** (already configured):
   ```bash
   npm run dev
   ```

3. **Use `http://127.0.0.1:3000/signup` in your browser** (NOT localhost)

4. **Enable Phone Authentication**:
   - Firebase Console → Authentication → Sign-in method → Phone → Enable

That's it! This is the #1 cause of phone OTP failures.

---

## Prerequisites

- Firebase project created at https://console.firebase.google.com
- Firebase credentials already configured in `.env.local`

## Step-by-Step Configuration

### 1. Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `virtual-mentor-2e4d0`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** in the sign-in providers list
5. Toggle **Enable** to ON
6. Click **Save**

### 2. Configure Authorized Domains ⚠️ CRITICAL

Phone authentication requires your domain to be in the authorized domains list.

**IMPORTANT**: Firebase Phone Auth does NOT work with `localhost` - you MUST use `127.0.0.1`

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain** and add:
   - `127.0.0.1` (REQUIRED for local development)
3. Verify your production domain is also listed (if deploying)

**Why 127.0.0.1 instead of localhost?**
Firebase changed their security policy in 2024/2025. Phone authentication now requires explicit IP addresses for reCAPTCHA verification. Using `localhost` will result in `auth/invalid-app-credential` errors.

### 3. Configure reCAPTCHA (Critical for Phone Auth)

Firebase automatically uses reCAPTCHA for phone verification. The app is configured to use **invisible reCAPTCHA**.

**Important**: If you're getting `auth/invalid-app-credential` errors, check:

1. In Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Scroll down to find reCAPTCHA settings
3. Ensure reCAPTCHA enforcement is enabled

### 4. Set Up Test Phone Numbers (Recommended for Testing)

Before testing with real phone numbers, set up test numbers to avoid SMS costs and rate limits:

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Scroll down to **Phone numbers for testing**
3. Click **Add phone number**
4. Add test numbers with verification codes, for example:
   - Phone: `+15555550100`
   - Code: `123456`
5. Click **Add**

**Benefits**:
- No SMS sent (instant verification)
- No costs
- No rate limits
- Perfect for development

### 5. Testing the Implementation

#### Test with Firebase Test Numbers (Recommended First)

1. Start your dev server: `npm run dev`
2. Navigate to `http://127.0.0.1:3000/signup` ⚠️ **Use 127.0.0.1, NOT localhost**
3. Enter your name
4. Enter a test phone number (e.g., `+15555550100`)
5. Click "Send Verification Code"
6. You should immediately see the OTP input screen
7. Enter the test code you configured (e.g., `123456`)
8. Verification should succeed instantly

#### Test with Real Phone Numbers

1. Start your dev server: `npm run dev`
2. Navigate to `http://127.0.0.1:3000/signup` ⚠️ **Use 127.0.0.1, NOT localhost**
3. Enter your name
4. Enter a real phone number with country code (e.g., `+12025550123`)
   - **Format**: `+` followed by country code and number
   - US: `+1` + 10-digit number
   - UK: `+44` + number
   - etc.
5. Click "Send Verification Code"
6. Wait for SMS (may take 30-60 seconds)
7. Enter the 6-digit code you received
8. Verification should succeed

### 6. Common Issues and Solutions

#### Issue: ❌ "auth/invalid-app-credential" Error (MOST COMMON)

**This is the #1 issue with Firebase Phone Auth!**

**Solutions**:
1. ✅ Add `127.0.0.1` to authorized domains in Firebase Console (Step 2)
2. ✅ Use `http://127.0.0.1:3000` in your browser (NOT localhost)
3. ✅ Restart your dev server after making changes
4. ✅ Clear browser cache and hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
5. ✅ Verify Phone sign-in method is enabled in Firebase Console

**Why this happens**: Firebase changed security policies in 2024/2025. Phone auth now requires explicit IP addresses (127.0.0.1) instead of hostnames (localhost) for reCAPTCHA verification.

#### Issue: "Firebase Phone Authentication is not properly configured"

**Solutions**:
1. Verify Phone sign-in method is enabled (Step 1)
2. Check that `127.0.0.1` is in authorized domains (Step 2)
3. Ensure Firebase config in `.env.local` is correct
4. Try using a test phone number first

#### Issue: "Phone number must start with + and country code"

**Solution**: Always include the country code with + prefix
- ✅ Correct: `+12025550123`
- ❌ Wrong: `2025550123`
- ❌ Wrong: `(202) 555-0123`

#### Issue: "Too many attempts"

**Solutions**:
1. Wait 1-2 hours before trying again
2. Use a different phone number
3. Use test phone numbers for development

#### Issue: SMS not received

**Solutions**:
1. Check phone number format (must include + and country code)
2. Verify your Firebase project has billing enabled (required for SMS in production)
3. Check your phone can receive SMS from short codes
4. Wait up to 5 minutes (sometimes delayed)
5. Use test phone numbers for development

#### Issue: "Security verification failed"

**Solutions**:
1. Refresh the page
2. Check browser console for detailed errors
3. Ensure you're on an authorized domain
4. Try in a different browser
5. Disable ad blockers that might block reCAPTCHA

### 7. Console Logging for Debugging

The updated code includes comprehensive logging:

- 🔧 `Initializing reCAPTCHA...` - reCAPTCHA setup started
- ✅ `reCAPTCHA widget rendered successfully` - Ready to send OTP
- 📞 `Attempting to send OTP to: +1234567890` - Sending SMS
- ✅ `OTP sent successfully` - SMS sent
- 🔍 `Verifying OTP...` - Checking code
- ✅ `OTP verified successfully` - Code correct
- ❌ Various error messages with details

Check the browser console (F12) for these logs to debug issues.

### 8. Production Considerations

When deploying to production:

1. **Add production domain** to authorized domains in Firebase Console
2. **Enable Firebase Blaze plan** (pay-as-you-go) for SMS sending
   - Free tier: 10 SMS/day
   - Paid: ~$0.01-0.06 per SMS depending on country
3. **Set up billing alerts** in Google Cloud Console
4. **Consider rate limiting** on your backend to prevent abuse
5. **Monitor Firebase usage** in Firebase Console → Usage and billing

### 9. Firebase Blaze Plan Setup (Required for Production SMS)

Firebase's free Spark plan has very limited SMS capabilities. For production:

1. Go to Firebase Console → **Project Settings** → **Usage and billing**
2. Click **Modify plan**
3. Select **Blaze (Pay as you go)**
4. Add payment method
5. Set up budget alerts (recommended: alert at $10, $50, $100)

**SMS Pricing** (approximate):
- US/Canada: ~$0.01 per SMS
- Europe: ~$0.02-0.04 per SMS
- Other regions: varies

### 10. Security Best Practices

1. **Never commit** `.env.local` to version control (it's in `.gitignore`)
2. **Use test numbers** for development to avoid costs
3. **Monitor usage** regularly in Firebase Console
4. **Set up billing alerts** to avoid surprises
5. **Rate limit** OTP requests on your backend (if you add one)
6. **Validate phone numbers** before sending (already implemented in code)

## Code Improvements Made

The following improvements were made to `app/src/app/signup/page.tsx`:

1. ✅ **Phone number validation** - Ensures proper format with country code
2. ✅ **Invisible reCAPTCHA** - Better UX (was "normal" size before)
3. ✅ **reCAPTCHA state management** - Tracks initialization and ready state
4. ✅ **Better error handling** - Specific messages for each error type
5. ✅ **Loading states** - Shows when reCAPTCHA is initializing
6. ✅ **User feedback** - Clear instructions and format hints
7. ✅ **Improved logging** - Detailed console logs for debugging
8. ✅ **Code validation** - Only enables verify button when 6 digits entered
9. ✅ **Auto-formatting** - Strips non-numeric characters from OTP input
10. ✅ **Better UX** - Disabled states, helpful placeholders, error recovery

## Quick Start Checklist

- [ ] Enable Phone sign-in method in Firebase Console
- [ ] Verify localhost is in authorized domains
- [ ] Add test phone number in Firebase Console
- [ ] Test with test phone number first
- [ ] Test with real phone number
- [ ] Check browser console for any errors
- [ ] Review Firebase usage and billing settings

## Support

If you encounter issues:

1. Check browser console (F12) for detailed error messages
2. Verify all steps in this guide are completed
3. Try with a test phone number first
4. Review Firebase Console → Authentication → Users to see if users are being created
5. Check Firebase Console → Authentication → Usage for SMS statistics

## Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
