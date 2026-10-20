# Ownership Map

A cross-platform mobile app (iOS and Android) that shows which restaurants belong to brands owned
by private equity (PE) firms, so diners can make informed choices.

> **All data in this repository is fictional sample data.** Brand, firm and restaurant names,
> addresses and sources are placeholders. Nothing here describes a real business.

## What it does

- **Map** of restaurants with clustering; only the pins in view are rendered, so thousands stay smooth.
- **Pins use shape + letter + colour** (never colour alone), in neutral hues.
- **Details sheet**: name, address, ownership chain (PE firm › holding company › brand), status,
  stake, confidence, year acquired, source link and last-verified date.
- **Search** by restaurant or brand name. **Filters**: All / PE-backed / Independent / Franchise of
  PE-backed brand.
- **Near me**: asks for location permission only when tapped; location never leaves the device.
- **Independent alternatives nearby** from any PE-backed restaurant, same cuisine first, by distance.
- **PE firm screen**: every brand a firm owns, including through holding companies.
- **About**: methodology, confidence levels, corrections, privacy.

No accounts, no analytics, no tracking, no backend.

## Run it

Requirements: Node 20+ and the **Expo Go** app on your phone (it must support Expo SDK 58).

```bash
npm install
npm start            # scan the QR code with Expo Go (iOS camera / Android Expo Go)
```

| Command                 | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm start`             | Dev server for Expo Go (iOS and Android)                                  |
| `npm run preview`       | Web preview with phone/desktop frames, dataset and theme toggles          |
| `npm run build:preview` | Builds `preview/ownership-map-preview.html`, a single self-contained file |
| `npm run check`         | Lint, format check, typecheck, tests, data validation (same as CI)        |
| `npm test`              | Unit tests                                                                |
| `npm run validate:data` | Validates `data/*.json`                                                   |

### Web preview (UAT sandbox)

`npm run preview` opens the app in a browser inside a frame. The toolbar switches between a
**Phone** (390×844) and **Desktop** (1280×800) frame, between sample data and **5,000 synthetic
pins** (for performance checks), and between light and dark themes. The web build uses Leaflet
with OpenStreetMap tiles and falls back to offline country/state outlines when tiles can't load.

The preview checks layout and flow. Native maps, permission prompts and VoiceOver/TalkBack differ
on real devices, so run the native rows of [`docs/UAT.md`](docs/UAT.md) in Expo Go before release.

The shell is enabled only by `EXPO_PUBLIC_PREVIEW_SHELL=1`; a shipped web build would leave it
off and get the same responsive app (side panel at ≥ 768 px wide).

### Live ownership lookup (test feature)

In the published web preview, searching a name that isn't in the sample data offers
**Look up live**: Claude researches the real owner from public sources and the answer appears in
the app, with sources and the same neutral wording rules. It is unreviewed and for testing only.
See [`docs/LIVE_LOOKUP.md`](docs/LIVE_LOOKUP.md).

### Google Maps API key (Android production builds only)

Expo Go and iOS (Apple Maps) need no key. For an Android production (EAS) build:

1. Create a key in Google Cloud with **Maps SDK for Android** enabled, restricted to the app's
   package name (`org.example.ownershipmap`, change before release) and signing certificate.
2. Copy `.env.example` to `.env` and set `GOOGLE_MAPS_ANDROID_API_KEY`, or set it as an EAS secret.
3. `app.config.ts` passes it to the `react-native-maps` config plugin at build time.

Never commit `.env`.

## Project structure

```
src/
  app/                 Expo Router routes only (thin): map, about, firm/[id]
  domain/              Pure logic + types, no React: ownership.ts (classification and ALL
                       ownership wording), filter, search, distance, alternatives, portfolio,
                       directory (joins the datasets)
  data/                Repository interfaces, JSON implementation, stress-test data, provider
  features/
    map/               Map screen, platform map canvases (MapCanvas.tsx native,
                       MapCanvas.web.tsx Leaflet), clustering, search/filter UI, Near me
    details/           Details sheet content, alternatives list
    firm/              PE firm "ownership web" screen
    about/             About / data disclaimer
    preview/           Web-only phone/desktop preview shell
  ui/                  Theme tokens, pin tokens, shared primitives
data/                  firms.json, brands.json, locations.json, schemas/, CONTRIBUTING.md
scripts/               validate-data.ts, validateDataset.ts, build-preview.ts
docs/UAT.md            Acceptance test checklist
```

Business logic lives in `src/domain` as pure functions with unit tests. Components only render.
Screens read data through `useDirectory()`, which loads via the `Repositories` interface in
`src/data/repositories.ts`. To move to an API or database, add a new implementation of that
interface and pass it to `DirectoryProvider`; no screen changes.

## Data model

**Ownership is a brand-level fact; the map is location-level.** Locations carry no ownership
fields. They join to brands by `brand_id`, so one brand correction updates every pin.

| File             | Fields                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firms.json`     | `id`, `name`, `type` (`pe_firm` \| `holding_company`), `website`                                                                                                                                                                                                                |
| `brands.json`    | `id`, `name`, `cuisine`, `parent_company` (firm id), `ownership_chain`, `status` (`current` \| `exited`), `stake_type` (`majority` \| `minority`), `confidence` (`confirmed` \| `reported`), `acquired_year`, `exited_year`, `source_url`, `last_verified`, `independent_group` |
| `locations.json` | `id`, `brand_id` (null = independent), `name`, `address`, `lat`, `lng`, `cuisine` (required for independents), `is_franchised`                                                                                                                                                  |

`ownership_chain` is a list of levels from the ultimate owner down to the brand's parent. Each
level holds one or more firm ids, so co-owners are supported: `[["firm_a", "firm_b"], ["holdco"]]`.

Additions beyond the original spec: `firms.type`, `brands.exited_year`, `brands.independent_group`,
`parent_company` as an id, list-of-levels `ownership_chain`, and a fixed cuisine list
(`data/schemas/cuisine.schema.json`).

### How a pin is classified

| Category                     | Rule                                              | Shown under |
| ---------------------------- | ------------------------------------------------- | ----------- |
| PE-backed                    | PE firm in chain, sourced, `current`, company-run | PE-backed   |
| Franchise of PE-backed brand | Same, but `is_franchised`                         | Franchise   |
| Independent                  | No brand, or `independent_group` brand            | Independent |
| Previously PE-owned          | PE firm in chain, sourced, `exited`               | All only    |
| Chain                        | Sourced brand with no PE firm in chain            | All only    |
| Ownership unverified         | No `source_url` or `last_verified`                | All only    |

Minority stakes count as PE-backed and are labelled "Minority stake held by …".

### Updating data

1. Edit the JSON in `data/`.
2. Run `npm run validate:data`. It fails on schema violations, a PE claim without `source_url` or
   `last_verified`, broken firm or brand references, and duplicate ids (plus other cross-field rules
   listed in `scripts/validateDataset.ts`).
3. Open a PR; CI runs the same validation.

Corrections from the public: see [`data/CONTRIBUTING.md`](data/CONTRIBUTING.md).

### Future: ingesting real location data (not built in v1)

A script under `scripts/ingest/` could build `locations.json` from open data:

1. **Fetch** restaurant POIs (`amenity=restaurant|fast_food|cafe`) from
   [OpenStreetMap](https://www.openstreetmap.org) via a regional Geofabrik extract or the Overpass
   API, or the `places` theme of [Overture Maps](https://overturemaps.org) (GeoParquet, queryable
   with DuckDB).
2. **Match to brands** using OSM's `brand:wikidata` tag or Overture's `brand.wikidata`, with a
   `wikidata` id stored on each brand. Fall back to normalized name matching only with manual review.
3. **Map fields**: name, address (`addr:*` or Overture `addresses`), lat/lng, cuisine (OSM
   `cuisine` mapped to our list), `is_franchised` (rarely available; default false, flagged for review).
4. **Write** `locations.json`, run `validate:data`, and open a PR. Keep the source and licence
   attribution (OSM: ODbL, Overture: CDLA-Permissive/ODbL per theme) in `data/`.

At national scale, move locations behind an API with bounding-box queries and add that method to
`LocationRepository`. The map already renders by viewport.

## Neutral-wording rules

All ownership text is generated in `src/domain/ownership.ts` and covered by tests.

- Factual verbs only: "Owned by [Firm] since 2019", "Minority stake held by…", "Previously owned
  by…". Never "controlled by", "bought out by", "taken over".
- Franchise-aware: a franchised location reads "Franchisor is PE-owned", never "This restaurant is
  PE-owned".
- Status and confidence are always shown: current vs. exited, confirmed vs. reported.
- Every ownership claim shows its source and last-verified date. No source means
  "Ownership unverified" and no PE label, no firm names and no chain.
- Records last verified more than 24 months ago are marked as possibly out of date.
- PE ownership is information, not an accusation: neutral colours, no alarm reds.

## Accessibility

Pins, groups, filters, buttons and links have screen-reader labels and roles; filters expose
selected state; focus moves into the details sheet when it opens. Text scales with the system
size (capped at 2×). Pin types differ by shape and letter as well as colour.

## Privacy

No analytics or tracking SDKs, no accounts. Location is requested only when "Near me" is tapped,
kept in memory, and never stored or sent. Alternatives are measured from the selected restaurant,
not from the user.

## Quality and CI

ESLint (Expo config), Prettier, TypeScript strict, Jest. `.github/workflows/ci.yml` runs lint,
format check, typecheck, tests and data validation on every push and pull request.

Intended workflow once the repo moves: one feature branch per major feature, small commits, merge
to `main` only when it runs and CI passes.

## Roadmap (not built)

- Share-sheet check: share a restaurant from Google Maps or Yelp into the app for an instant answer.
- Ownership timeline: sourced changes after acquisition.
- On-device personal dining footprint log.
- Other ownership lenses: publicly traded, foreign-owned, family-owned.
- Real location data ingestion pipeline (see above).
- Production web build with a commercial tile provider.

## Licenses

- Code: [MIT](LICENSE).
- Data in `data/`: [CC BY 4.0](data/LICENSE.md).
- Web preview map: © OpenStreetMap contributors (tiles); Natural Earth and US Census outlines
  (public domain) via `world-atlas` and `us-atlas`.
