import { Circolo } from '../classes/Circolo';
import { logger } from './logging';
import Stripe from 'stripe';


const products: Stripe.ProductCreateParams[] = [
    {
        id: "partecipazione_partita",
        name: "Partita di padel"
    }
]

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

export async function getOnboardingLink(stripeID: string, redirectURL: URL): Promise<Stripe.AccountLink | null> {
    const accLink: Stripe.AccountLink = await stripe.accountLinks.create({
        account: stripeID,
        refresh_url: redirectURL.toString(),
        return_url: redirectURL.toString(),
        type: 'account_onboarding',
    });

    if (accLink) {
        logger.info(`Account link onboarding: ${accLink.url}`)
        return accLink
    }

    return null;
}

export async function checkOnboarding(stripeID: string): Promise<boolean | null> {
    const accInfo: Stripe.Account = await stripe.accounts.retrieve(stripeID);
    if (accInfo) {
        return accInfo.requirements?.disabled_reason == null;
    }
    return null
}

export async function populateProducts() {
    const accList = await stripe.products.list()
    accList.data.forEach((prod) => {
        stripe.products.del(prod.id)
    })
    console.log("finished")
    for await (const val of products) {
        const prod = await stripe.products.create(val);
        logger.info(prod);
    }
}

export async function handlePaymentPrenotazione(stripeID: string, slotPrice: number): Promise<Stripe.PaymentLink | null> {
    const centPrice = slotPrice * 100
    const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: centPrice,
        product: `partecipazione_partita`
    })
    if (price) {
        const payInfo: Stripe.PaymentLink = await stripe.paymentLinks.create({
            line_items: [{
                price: price.id,
                quantity: 1
            }],
            after_completion: {
                type: 'redirect',
                redirect: {
                    url: `http://localhost:8080/api/v1/webhook`,
                },
            },
            transfer_data: {
                destination: stripeID
            }
        })
        console.log(payInfo)
        return payInfo;
    }

    return null;
}
