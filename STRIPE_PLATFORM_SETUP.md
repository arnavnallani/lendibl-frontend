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
Fill out these required fields:

**Business Information:**
- Platform name: `Lendibl`
- Platform description: `Peer-to-peer rental marketplace connecting item owners with renters`
- Platform website: `[Your Replit app URL]`
- Business type: `Marketplace`

**Loss Liability:**
- Choose: `Platform assumes liability for losses`
- This means Lendibl handles disputes and chargebacks

**Platform Details:**
- Connected account types: `Express accounts`
- Geographic regions: `United States`
- Industries: `Consumer goods rental`

### 4. Submit for Review
- Click **"Save and submit for review"**
- Stripe typically reviews within 1-2 business days
- You'll receive email confirmation when approved

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