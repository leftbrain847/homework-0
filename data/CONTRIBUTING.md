# Submitting ownership corrections

Ownership Map only shows an ownership claim when it has a public source. Corrections follow the
same rule: **no source, no change.**

> The data in this directory is currently fictional sample data. Once real data is added, the
> process below applies to it.

## What counts as a source

| Confidence  | Acceptable sources                                                             |
| ----------- | ------------------------------------------------------------------------------ |
| `confirmed` | Press release or website of the brand or firm; regulatory filing; court record |
| `reported`  | Reporting by an established news or trade outlet that names its basis          |
| —           | Not accepted: social media posts, forums, unsourced blogs, personal knowledge  |

## Option 1: open an issue (no coding needed)

Open an issue titled `Ownership correction: <brand name>` with:

1. The brand (and a location, if the problem is location-specific).
2. What is wrong and what it should say.
3. A link to the source, and the date you checked it.

## Option 2: open a pull request

1. Edit the right file:
   - Who owns a brand: `brands.json` (and `firms.json` if the firm is new).
   - A restaurant's name, address, position, or franchise status: `locations.json`.
2. Update `source_url` and set `last_verified` to the date you checked the source (`YYYY-MM-DD`).
3. Run `npm run validate:data`. It fails if a PE claim has no source or date, an id is
   duplicated, or a reference does not resolve.
4. In the PR description, quote the sentence in the source that supports the change.

## Field rules (brands.json)

- `ownership_chain` lists firm ids from the ultimate owner down to the brand's direct parent.
  Co-owners share a level: `[["firm_a", "firm_b"], ["holdco"]]`.
- Any brand with a PE firm in its chain needs `source_url`, `last_verified`, `status`,
  `stake_type`, `confidence` and `acquired_year`.
- `status: "exited"` needs `exited_year`.
- `independent_group: true` is for small locally owned groups and cannot have a PE firm in the chain.

## Wording

Keep descriptions neutral and factual. The app generates all display text from these fields;
do not add free-text commentary to the data.
