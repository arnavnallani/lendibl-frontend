# Stripe Platform Profile Setup Guide

## Required Steps to Enable Real Money Transfers

### 1. Access Stripe Dashboard
- Go to: https://dashboard.stripe.com/
- Make sure you're in **Live Mode** (not Test Mode)

### 2. Navigate to Connect Settings
- Click **"Settings"** in the left sidebar
- Under Settings, click **"Connect"**
- Look for **"Platform profile"** section

### 3. Complete Platform Profile
Your platform profile is already configured! You just need to acknowledge the agreements:

**Required Actions:**
1. Click **"Acknowledge"** next to "Negative balance liability acknowledgement" 
2. Click **"Acknowledge"** next to "Requirement collection acknowledgement"

**Current Settings (Already Configured):**
- Funds flow: ✅ Sellers collect payments directly
- Account creation: ✅ Onboarding hosted by Stripe  
- Negative balance liability: ✅ Stripe handles liability

### 4. Immediate Activation
- No review period required - activation is instant
- Once you click both "Acknowledge" buttons, Connect accounts work immediately

### 5. After Approval
Once approved, the Stripe Connect account creation will work automatically and process real money transfers.

## Current Status
- Payment collection: ✅ Working (renters can pay)
- Platform profile: ❌ Pending setup
- Real money transfers: ❌ Blocked until profile approved

## What Happens After Setup
1. Owners click "Connect Bank Account" → Real Stripe Express account created
2. Stripe onboarding completed → Bank account linked
3. Rental completes → Real money transfer to owner's bank account
4. Zero manual intervention required