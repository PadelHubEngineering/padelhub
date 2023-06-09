import { Circolo } from '../classes/Circolo';
import { logger } from './logging';
import Stripe from 'stripe';


const products: Stripe.ProductCreateParams[] = [
    {
        id: "slot_60",
        name: "Slot 60 minuti"
    },
    {
        id: "slot_90",
        name: "Slot 90 minuti"
    },
    {
        id: "slot_120",
        name: "Slot 120 minuti"
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
    for await (const val of products) {
        const prod = await stripe.products.create(val);
        logger.info(prod);
    }
}

export async function handlePaymentSlot(stripeID: string, durataSlot: number, slotPrice: number): Promise<Stripe.PaymentLink | null> {
    if (durataSlot == 60 || durataSlot == 90 || durataSlot == 120) {
        const centPrice = durataSlot*100
        await stripe.prices.create({
            currency: "eur",
            unit_amount: centPrice,
            product: `slot_${durataSlot}`
        }).then(async (price) => {
            if(price){
                const payInfo: Stripe.PaymentLink = await stripe.paymentLinks.create({
                    line_items: [{
                        price: price.id,
                        quantity: 1
                    }],
                    transfer_data: {
                        destination: stripeID
                    }
                })
                console.log(payInfo)
                return payInfo;
            }
        })
    }
    return null;
}
