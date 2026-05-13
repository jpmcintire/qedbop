# Deploying the teacher platform — a non-technical walkthrough

This guide gets the new platform live on the same Railway project that already serves qedbop.com. **The existing static catalog (qedbop.com homepage, /poems, /about) will keep working the entire time.** The new routes (`/app`, `/admin`, `/a/[slug]`) won't function until you finish all the steps below — but they won't break anything either.

If you get stuck at any step, stop. Don't keep clicking. Tell Claude where you are and what you see.

## What you'll need open in tabs

1. **GitHub** — `https://github.com/jpmcintire/qedbop`
2. **Railway** — `https://railway.app` (sign in with the same account that hosts qedbop.com)
3. **Anthropic console** — `https://console.anthropic.com` (sign in or sign up)

## Step 1 — Merge the pull request (GitHub)

I've opened a PR for you. Visit it on GitHub. You'll see a green button labeled **"Merge pull request."** Click it. Then click **"Confirm merge."**

What this does: copies the new platform code from the feature branch into `main`, the branch Railway watches for production. Railway will immediately try to build the site. **The build will fail** the first time — that's expected. We fix it in the next steps.

(If you want Dante to review the code before merging, stop here and forward him the PR link. He can leave comments on GitHub and the PR will wait for you. The static qedbop.com site keeps running either way.)

## Step 2 — Get an Anthropic API key

1. Go to `https://console.anthropic.com/settings/keys`.
2. Click **"Create Key."** Name it `qedbop-production`.
3. Copy the key that appears. It starts with `sk-ant-`. **Save it somewhere safe immediately — Anthropic only shows it once.**
4. Same site, top right: there's a billing section. Add a payment method and put a small initial balance ($5–$10 is plenty to start). Without billing, the API returns errors.

Keep this key handy for Step 4.

## Step 3 — Add a Postgres database on Railway

1. Open Railway and click into your existing qedbop project.
2. In the project view there's a **"+ New"** or **"Create"** button. Click it.
3. Choose **"Database"** → **"Add PostgreSQL."**
4. Wait 30 seconds while it spins up. You'll see a new service appear in the project, labeled "Postgres."

Railway automatically wires `DATABASE_URL` from the Postgres service into your web service's environment variables. You don't have to copy anything by hand.

## Step 4 — Set the other environment variables on Railway

1. In Railway, click on the **web service** (the one running the Next.js app, not the Postgres one).
2. Click the **"Variables"** tab.
3. For each of these, click **"+ New Variable"** and paste in:

| Variable name | Value |
| --- | --- |
| `AUTH_SECRET` | Generate one at `https://generate-secret.vercel.app/32` and paste it here |
| `AUTH_URL` | `https://qedbop.com` |
| `ANTHROPIC_API_KEY` | The `sk-ant-...` key from Step 2 |
| `ADMIN_EMAILS` | Your email and Dante's email, comma-separated. Example: `john@example.com,dante@example.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://qedbop.com` |

Optional, only if you want "Sign in with Google" to work:

| `AUTH_GOOGLE_ID` | from console.cloud.google.com |
| `AUTH_GOOGLE_SECRET` | from console.cloud.google.com |

(Skip the Google ones for now. Email + password sign-in works without them. You can add Google later.)

Once all the variables are saved, Railway will automatically redeploy. Watch the **"Deployments"** tab — the latest one should turn green within a couple of minutes. If it goes red, click into it and copy the error log to Claude.

## Step 5 — Initialize the database (one-time)

The database exists but is empty. We need to create the tables and seed one sample poem.

1. In Railway, click on the **web service** again.
2. Look for the **"..." menu** or a tab labeled **"Settings"** or **"Console."** Different Railway UI versions place this in slightly different spots; if you can't find it, search Railway's help for "run command" or ask Claude.
3. Find the option to run a one-off command. The exact label is something like **"Run Command"** or **"Shell"**.
4. Run these two commands, one at a time, waiting for each to finish:

```
npx prisma db push
npx prisma db seed
```

The first command creates all the database tables. The second inserts one sample Work (Frost's "Stopping by Woods on a Snowy Evening") so the lesson builder has something to point at the first time you open it.

If the Railway UI doesn't expose a shell easily, an alternative is: install the Railway CLI on your laptop (`brew install railway`), run `railway login`, then `railway run npx prisma db push` and `railway run npx prisma db seed`. Same effect.

## Step 6 — Try it

1. Visit `https://qedbop.com/auth/signup`.
2. Sign up with the email you put in `ADMIN_EMAILS`. (That email gets auto-promoted to admin.)
3. You'll land on `/app/profile`. Fill in your state, grade levels, and course type.
4. Click **Dashboard** in the nav. You should see a clean dashboard with a "Create new" button.
5. Click **Admin** in the nav (it only shows for admins). Open the seeded Frost work and replace the placeholder music notes with your real ones. The form has two clearly labeled fields:
   - **Red box ("Never fed to Claude")** — your timestamped specifics. "At 1:20 the bass drops out…"
   - **Green box ("Safe to send to Claude")** — your broader interpretive notes. No timestamps.
6. Go back to **Build**. Pick the Frost work, select the version, choose "Single analysis" and "Quick Assignment," and click **Generate assignment**. Wait 10–20 seconds.
7. If you see questions, a writing prompt, and a rubric — it's working. Click **Publish**, then open the resulting link in a private/incognito window to see what students will see.

## What's normal

- The first generation takes 10–30 seconds. That's Claude thinking.
- The first time you visit qedbop.com after deploy, it can be a few seconds slow as Railway warms up.
- The static catalog (`/`, `/poems`, `/about`) continues to work throughout — none of these steps touch it.

## When something goes wrong

Don't troubleshoot blind. Take a screenshot or copy the error text and bring it back to Claude. Common ones:

- **"DATABASE_URL is not set"** — Step 3 didn't complete, or Railway didn't auto-wire it. In the web service's Variables tab, you should see `DATABASE_URL` listed (its value will be hidden). If it's missing, click into the Postgres service, find its connection string, and add it to the web service variables manually.
- **"ANTHROPIC_API_KEY is not set"** or **"401 Unauthorized"** — re-check Step 4. The key needs to be the full `sk-ant-...` string with no spaces.
- **Sign-in succeeds but the page reloads to the sign-in screen** — `AUTH_SECRET` might not be set, or `AUTH_URL` doesn't match the actual domain. Re-check Step 4.
- **Generation returns an error mentioning "no-timestamps" or "specificity-rubric-required"** — Claude's output didn't pass the safety checks. The system retries once automatically. If it still fails, it means the model wrote a curriculum that violates one of the four mandatory rules. That's a design success, not a bug — but you should bring the exact error message back to Claude so we can tune the prompt.

## After it's running

Things to do early:
- Add more Works + Versions via `/admin/works`. The platform feels real once there are five or six poems.
- Invite Dante to test as a non-admin teacher (have him sign up with a different email).
- Decide whether you want to publicize `/app` from the homepage or keep it quiet until you've recruited a small pilot group.

Things you can ignore for a while:
- Payments (not in MVP). The platform is free for everyone right now.
- Coaching podcasts (not in MVP). Generate them in NotebookLM by hand for the first few Works.
- Google sign-in (optional). Email/password works fine.
