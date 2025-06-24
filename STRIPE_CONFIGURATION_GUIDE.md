# Stripe US Platform Configuration Guide

## The Issue
Your Stripe account is getting the error: "The recipient ToS agreement is not supported for platforms in US creating accounts in US."

This happens because your Stripe account needs special configuration for US domestic marketplace platforms.

## Solution: Contact Stripe Support

### Step 1: Contact Stripe Support
- Email: support@stripe.com
- Subject: "US Domestic Marketplace Platform Configuration"

### Step 2: Use This Message Template
```
Hi Stripe Support,

I'm setting up a marketplace platform (Lendibl) and getting this error when creating Express accounts:

"The recipient ToS agreement is not supported for platforms in US creating accounts in US"

Request ID: [Insert latest request ID from error logs]

I need my platform configured for US domestic marketplace operations where:
- Platform is based in US
- All connected accounts are US-based
- We handle rental transactions between US users

Please configure my account for proper US domestic marketplace operations.

Account details:
- Platform: Lendibl (rental marketplace)
- Business type: Peer-to-peer rental platform
- Geographic scope: US domestic only

Thank you,
[Your name]
```

### Step 3: What Stripe Will Do
- Review your account configuration
- Enable proper US domestic marketplace settings
- Remove ToS acceptance requirements for your platform
- Usually takes 1-2 business days

### Step 4: After Configuration
Once Stripe configures your account:
- Connect account creation will work immediately
- Real money transfers will be fully automated
- No code changes needed

## Current Status
✅ Payment collection from renters (working)
✅ Platform profile acknowledged 
❌ Connect account creation (blocked by ToS configuration)
❌ Automated payouts to owners (waiting for fix)

## Alternative: Manual Payouts
While waiting for Stripe configuration, I can implement a manual payout system where you transfer money to owners yourself using Stripe's standard payout features.