-- Optional seed for local dev (do not run in production as-is)

INSERT INTO plans (name, stripe_price_id, amount_cents, currency, interval, active)
VALUES ('Qyraze Setter', 'price_replace_me', 14700, 'eur', 'month', true)
ON CONFLICT (stripe_price_id) DO NOTHING;
