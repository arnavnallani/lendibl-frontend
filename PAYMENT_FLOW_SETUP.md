# Lendibl Payment Flow Setup Guide

## Current Money Flow
Renter → Lendibl Stripe → Lendibl PayPal → Owner PayPal

## Required Setup for Automated Payouts

### 1. Lendibl PayPal Business Account
- Create PayPal Business account for Lendibl
- Complete business verification 
- Enable PayPal Payouts API
- Get API credentials (Client ID, Client Secret)

### 2. Connect Stripe to PayPal
**Option A: Manual Transfer Process**
- Weekly: Transfer accumulated owner payouts from Stripe to bank
- Weekly: Add funds to Lendibl PayPal account 
- Automated: PayPal sends individual payouts to owners

**Option B: Automated Bank Integration**
- Set up automatic bank transfers from Stripe
- Set up automatic PayPal funding from bank account
- Fully automated money flow

### 3. PayPal API Configuration
```env
PAYPAL_CLIENT_ID=your_business_account_client_id
PAYPAL_CLIENT_SECRET=your_business_account_secret
```

### 4. Money Flow Benefits
✅ Automated owner payouts via PayPal API
✅ Exact commission control (Lendibl keeps difference)
✅ Real-time payout tracking and status
✅ Professional PayPal receipts for owners
✅ Simplified owner setup (just PayPal email)

### 5. Current Status
- PayPal API integration: ✅ Complete
- Owner email collection: ✅ Complete  
- Payout automation: ⚠️ Requires Lendibl PayPal funding
- Error handling: ✅ Complete with funding notifications

### 6. Next Steps
1. Fund Lendibl PayPal account with test amount
2. Complete a test payout to verify flow
3. Set up regular funding process
4. Enable full automation