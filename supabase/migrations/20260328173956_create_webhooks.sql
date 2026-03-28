-- Webhooks: outbound HTTP endpoints that Mappra fires on events.
-- The user connects these URLs to n8n (or any other automation tool).

CREATE TABLE IF NOT EXISTS webhooks (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                TEXT        NOT NULL,
  url                 TEXT        NOT NULL,
  events              TEXT[]      NOT NULL DEFAULT '{}',
  active              BOOLEAN     NOT NULL DEFAULT true,
  secret              TEXT,                         -- optional HMAC-SHA256 signing secret
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_triggered_at   TIMESTAMPTZ,
  last_http_status    SMALLINT
);

-- Delivery log: every time a webhook fires, we record the outcome.
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id    UUID        NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event         TEXT        NOT NULL,
  payload       JSONB       NOT NULL,
  http_status   SMALLINT,
  response_ms   INT,
  error         TEXT,
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id
  ON webhook_delivery_logs (webhook_id, triggered_at DESC);
