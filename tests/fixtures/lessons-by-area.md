# Lessons

## Always

- Never log a raw database driver error; duplicate-key messages can echo an access token.
- The user id in the verified token is authoritative; never repair user data by device id alone.
- Never commit secrets or credentials; read them from the environment at runtime.
- Work is done only when `persist doctor` reports PASSED and the tests pass.

## Mongo indexes

Applies To:
- `internal/db/**`
- `migrations/**`

Also Known As: index, unique, partial index, migration, E11000

- Existing index names are part of deployment compatibility; keep the deployed name.
- MongoDB 8 rejects `$ne` in `partialFilterExpression`; use `$type: "string"` with `$gt: ""`.
- Create unique indexes with `createIndex` in a migration, never inline at request time.
- A duplicate-key E11000 on signup means the email index caught a race; return exists, not an error.
- Partial indexes must cover the query filter or the planner falls back to a full scan.
- Compound index field order follows the query: equality fields first, then the range field.
- Dropping an index in production needs a Proposed ADR; reads may depend on its ordering.
- Backfill new unique fields before enforcing uniqueness, or the migration fails on old rows.

## Auth sessions

Applies To:
- `src/auth/**`
- `internal/session/**`

Also Known As: session, token, login, refresh, cookie, logout

- Refresh tokens rotate on every use; accept the previous token once for concurrent requests.
- Session cookies are HttpOnly, Secure, and SameSite Lax; JavaScript never reads them.
- Short access tokens with long refresh tokens limit the blast radius of a leak.
- Revoke all sessions on password change; keep a version counter on the user record.
- Never accept a user id from the request body; read it from the verified token.
- Sliding expiration extends sessions only on user activity, never on background polling.
- Log out everywhere by bumping the session epoch, not by deleting rows one by one.
- OAuth state parameters must be random per attempt and checked before code exchange.

## Push notifications

Applies To:
- `src/notify/**`
- `functions/push/**`

Also Known As: FCM, push, notification, device token, APNs

- FCM device tokens change without warning; register the new token on every app start.
- A NotRegistered response means the token is dead; delete it instead of retrying.
- Batch topic sends instead of looping over tokens; per-token loops hit rate limits.
- iOS silent pushes need content-available and a matching background mode entitlement.
- Collapse keys keep chatty updates to the latest message; never collapse receipts.
- Store one token row per device, keyed by installation id, not by user id.
- Dry-run FCM sends in staging; production credentials never leave the secret store.

## Product analytics

Applies To:
- `src/analytics/**`

Also Known As: CleverTap, event, profile, campaign, segment

- CleverTap events fire from the server after commit, never from the client before it.
- Identify the profile before tracking the event or funnels split across two users.
- One canonical event name per action; aliases break every downstream campaign.
- Queue analytics behind the outbox so a CleverTap outage never fails a checkout.
- Never put payment identifiers in event properties; use the internal order id.
- Backfill profile properties on login so campaigns see history, not just new events.
- Drop events that fail validation loudly in development and silently in production.

## Deploy

Applies To:
- `deploy/**`
- `.github/workflows/**`

Also Known As: deploy, release, rollout, rollback, migration deploy

- Run migrations before the new code serves traffic, never after.
- Roll back by redeploying the previous image; never patch forward under pressure.
- Gate destructive migrations behind an expand-contract-backfill sequence.
- Health checks must hit a real dependency, not a static ok endpoint.
- Pin base images by digest; floating tags deploy different code than reviewed.
- Database seeds run only in review apps; production seeds need a Proposed ADR.
- Announce maintenance windows before running a migration that locks writes.

## Fix-It jobs

Applies To:
- `jobs/**`
- `src/worker/**`

Also Known As: job, worker, queue, retry, cron, schedule

- Fix-It jobs are idempotent; the same job may run twice after a worker restart.
- Retry with exponential backoff and a dead-letter queue, never a tight loop.
- One job claims one shard with an advisory lock; overlapping runs corrupt counts.
- Cron schedules live in code, not in the dashboard, so review sees them.
- Long jobs checkpoint progress; a restart resumes instead of starting over.
- Poison messages move to quarantine after five attempts, with the payload attached.
- Scale workers by queue depth, not CPU; waiting jobs are idle, not busy.

## API errors

Applies To:
- `src/api/**`

Also Known As: error, status code, validation, 500, problem details

- Validation failures return 422 with field-level problems, never a bare 400.
- Internal 500 responses carry a correlation id and nothing else to the client.
- Map known domain failures to status codes at the boundary, not in handlers.
- Retryable errors say so in the body; clients must not guess from the code.
- Paginate every list endpoint; unbounded arrays become outages at scale.
- Error messages name the field and the constraint, never the stack or query.
- Version breaking error shapes through the API changelog, not silently.
