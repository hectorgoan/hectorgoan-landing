// Buy page: Paddle's overlay checkout, then the licence key from Lumina's
// store Worker (hectorgoan/lumina › store/).
//
// LIVE switches the page to the live Paddle account once its domain is
// approved and the live store is deployed (store/setup.sh production).
// After that, ?sandbox still opens the sandbox checkout for testing.
const LIVE = false;
const STORES = {
    sandbox: {
        environment: 'sandbox',
        token: 'test_6a22d7fe2984f7ed59a0e9738b5', // client-side tokens are public by design
        priceID: 'pri_01m6pdvtw0x1ewc85vkbtcsp48',
        worker: 'https://lumina-store-sandbox.hectorgoan.workers.dev',
    },
    production: {
                token: 'live_e2248662111a2382cbdb030e286',
        priceID: 'pri_01m7jqwc537qvrwmr18hg939ks',
        worker: 'https://lumina-store.hectorgoan.workers.dev',
    },
};
const STORE = LIVE && !new URLSearchParams(location.search).has('sandbox') ? STORES.production : STORES.sandbox;

const $ = (id) => document.getElementById(id);

function openCheckout() {
    Paddle.Checkout.open({
        items: [{ priceId: STORE.priceID, quantity: 1 }],
        settings: { displayMode: 'overlay', theme: document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light', variant: 'one-page' },
    });
}

// After checkout: ask the store for the key until Paddle has marked the
// purchase completed (usually a few seconds).
async function showKey(txn) {
    $('buy-offer').hidden = true;
    $('buy-done').hidden = false;
    for (let attempt = 0; attempt < 30; attempt++) {
        try {
            const response = await fetch(`${STORE.worker}/licence?txn=${encodeURIComponent(txn)}`);
            if (response.ok) {
                const licence = await response.json();
                $('buy-status').textContent = `Your licence key, for ${licence.email}:`;
                $('buy-key').textContent = licence.key;
                $('buy-key-box').hidden = false;
                $('buy-steps').hidden = false;
                if (licence.emailed) $('buy-email-note').textContent = 'We’ve emailed it to you too.';
                return;
            }
            if (response.status !== 404) break;
        } catch { /* network hiccup: try again */ }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    $('buy-status').innerHTML = `Your payment went through, but your key is taking a while. Reload this page in a minute, or <a href="mailto:hectorgoancodes@gmail.com?subject=Lumina%20licence%20key%20(${encodeURIComponent(txn)})">email me</a> with order <strong>${txn}</strong> and I’ll send it.`;
}

$('buy-copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText($('buy-key').textContent);
    $('buy-copy').textContent = 'Copied';
    setTimeout(() => { $('buy-copy').textContent = 'Copy Key'; }, 2000);
});

if (STORE.environment) Paddle.Environment.set('sandbox');
Paddle.Initialize({
    token: STORE.token,
    eventCallback(event) {
        if (event.name === 'checkout.completed' && event.data?.transaction_id) {
            const txn = event.data.transaction_id;
            // A reload shows the key again.
            history.replaceState(null, '', `?${STORE === STORES.sandbox && LIVE ? 'sandbox&' : ''}txn=${txn}`);
            Paddle.Checkout.close();
            showKey(txn);
        }
    },
});

const txn = new URLSearchParams(location.search).get('txn');
if (txn) {
    showKey(txn);
} else {
    // The local price, in the visitor's currency.
    Paddle.PricePreview({ items: [{ priceId: STORE.priceID, quantity: 1 }] })
        .then((preview) => {
            const total = preview.data?.details?.lineItems?.[0]?.formattedTotals?.total;
            if (total) $('buy-price').textContent = total;
        })
        .catch(() => {});
    $('buy-button').disabled = false;
    $('buy-button').addEventListener('click', openCheckout);
    // Lumina's Buy button lands here: open the checkout straight away.
    openCheckout();
}
