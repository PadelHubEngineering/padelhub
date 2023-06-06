import { logger } from './logging';
import Stripe from 'stripe';


//chiave già controllata in preliminary check
const stripe = new Stripe(process.env.STRIPE_KEY!, {
    apiVersion: '2022-11-15',
    typescript: true
});

export async function createConnectedAccount(email: string) {
    console.log("creating")
    const params: Stripe.AccountCreateParams = {
        type: 'custom',
        country: 'IT',
        email: email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        }
    };

    //const customer: Stripe.Customer = await stripe.customers.create(params);
    const account: Stripe.Account = await stripe.accounts.create(params)

    if (account) {
        logger.info("Account creato: ", account.id)
        return account.id;
    }
    return null;
}

export async function getOnboardingLink(stripeID: string, redirectURL: URL) {
    const accLink: Stripe.AccountLink = await stripe.accountLinks.create({
        account: stripeID,
        refresh_url: redirectURL.toString(),
        return_url: redirectURL.toString(),
        type: 'account_onboarding',
    });

    if(accLink){
        logger.info(`Account link onboarding: ${accLink.url}`)
        return accLink
    }

    return null;
}

