# Zensation

Product website and interactive makeup studio for **Zensation Second Skin Barrier Gel**.

## Features

- Responsive product presentation with official social channels.
- Makeup studio with skin preparation, makeup palettes, hairstyles, accessories and outfits.
- Downloadable character looks.
- Campaign registration with Supabase storage and a confirmation screen.
- Mobile navigation, keyboard focus states and reduced-motion support.

## Run locally

No frontend build step is required. With Python 3 installed:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Serve the files over HTTP rather than opening HTML files directly.

## Project structure

```text
dist/
  index.html       Product page
  makeup.html      Makeup studio
  redeem.html      Registration form
  activity.html    Activity and data information
  styles.css       Shared layout and visual system
  makeup.css       Studio presentation
  ui.js            Shared navigation behavior
  script.js        Channel links and registration
  makeup.js        Character interactions and image export
  config.js        Public client configuration
  assets/          Product and character images
supabase/
  register_participant.sql   Table and registration function
```

## Configure registration

1. Create a Supabase project.
2. Run `supabase/register_participant.sql` in the SQL Editor.
3. Set `supabaseUrl` and `supabaseAnonKey` in `dist/config.js` using the project URL and a publishable or legacy anon key. Never use a secret or service-role key in client code.
4. Start the local server and test with clearly identified test data.

The public repository leaves database settings empty. Until configured, the form reports that registration is unavailable. It does not show a successful submission without a database response.

The accepted campaign phrase is `Confidence No Compromises`. Validation ignores capitalization and whitespace; other words and punctuation are rejected. A submission UUID is reused for network retries to prevent duplicate inserts from that attempt. New visits can submit again; there is no per-phone entry limit.

Records are stored in `campaign_registrations`. Row-level security is enabled, and anonymous visitors cannot read the table. The public registration function validates the required fields before inserting a record. Winners are selected by the campaign organizer outside the website and contacted by phone. No automatic prize draw runs on the website.

The organizer can inspect or export registrations through the Supabase Table Editor. Registrant records are not included in this repository.

## Update links and content

Edit `channels` in `dist/config.js` to update TikTok, Instagram and Shopee destinations. Empty destinations remain inactive. Product copy and activity information are in the corresponding HTML files.

## Deployment

Deploy the `dist` directory to a static web host. It contains the complete frontend; no server-side JavaScript is required. Supabase provides the registration endpoint independently.

## Assets

Brand names, product photography and character artwork are included for this project. Their inclusion does not grant permission for unrelated reuse.

### Vercel

Import this repository with the root directory left at the repository root and
Framework Preset set to **Other**. `vercel.json` sets the build command and output
folder. Add these environment variables before deploying:

- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY`: your publishable key or legacy anon key.

The build copies `dist/` into `build/` and injects these public client settings.
Do not use a service-role or secret key. The source configuration stays empty.
