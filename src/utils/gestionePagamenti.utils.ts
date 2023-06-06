import { Circolo } from '../classes/Circolo';
import { logger } from './logging';
import Stripe from 'stripe';


//chiave già controllata in preliminary check
const stripe = new Stripe(process.env.STRIPE_KEY!, {
    apiVersion: '2022-11-15',
    typescript: true
});

export async function deleteAllAccounts() {
    const accList = await stripe.accounts.list()
    accList.data.forEach((acc) => {
        stripe.accounts.del(acc.id)
    })
    console.log("finished")
}

export async function createConnectedAccount(email: string) {
    console.log("creating")
    const params: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'IT',
        email: email,
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

export async function checkOnboarding(stripeID: string): Promise<boolean | null> {
    const accInfo: Stripe.Account = await stripe.accounts.retrieve(stripeID);
    if(accInfo){
        console.log(accInfo)
    }
    return null
}
