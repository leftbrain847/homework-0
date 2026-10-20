# UAT checklist (v1 proof of concept)

Run these in the web preview (phone and desktop frames), then the native-only ones in Expo Go on
an iPhone and an Android phone. Record pass/fail and notes per row.

All data is fictional sample data.

## A. Map and pins

| #   | Steps                                               | Expected                                                                                                                        |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Open the app                                        | Map fits all pins (Chicago, Austin, Denver, Toronto) as numbered groups. "Sample data" notice visible.                          |
| A2  | Tap a numbered group                                | Map zooms in; group splits into smaller groups or pins.                                                                         |
| A3  | Look at the pins                                    | Each type has its own shape **and** letter: P square, F diamond, I circle, E hollow square, C rounded, ? dashed circle. No red. |
| A4  | Open "Key" (phone) or read the side panel (desktop) | Key lists all six types with a one-line description.                                                                            |
| A5  | Preview toolbar: Data → 5,000 pins. Pan and zoom    | Map stays responsive. Groups show counts; individual pins appear only when zoomed in.                                           |

## B. Details sheet

| #   | Search for / tap                       | Expected                                                                                                                                                                            |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Harborline Burger Co. — West Loop      | "Owned by Quillmere Capital (sample) since 2019". Chain: Quillmere › Brightplate › Harborline. Status Current, Majority stake, Confirmed, 2019. Source link and last-verified date. |
| B2  | Harborline Burger Co. — Pilsen         | "Franchised location. Franchisor is PE-owned (…)". Never says "this restaurant is PE-owned". Diamond F pin.                                                                         |
| B3  | Pastaio Fresco (any)                   | "Minority stake held by Tamberlake Equity Partners (sample) since 2021".                                                                                                            |
| B4  | Ember & Rye Smokehouse — Fulton Market | "Owned by Tamberlake … and Ostravale … since 2020" (two co-owners).                                                                                                                 |
| B5  | Lotus Lane Noodle Bar — Uptown         | "Franchised location. Franchisor was previously PE-owned (Ostravale Partners (sample), 2015–2022)". Hollow E pin. Status Exited.                                                    |
| B6  | Tidewater Taqueria (any)               | Confidence shows "Reported (not independently confirmed)".                                                                                                                          |
| B7  | Sunmill Bakery Café (any)              | Last verified Mar 15, 2023 with "may be out of date" notice.                                                                                                                        |
| B8  | Greenbowl Salads — Loop                | "Ownership unverified". **No firm names, no chain, no PE label.** Link to how to submit a correction.                                                                               |
| B9  | Copper Kettle Diner (any)              | Chain pin. "Part of Copper Kettle Diner, owned by Maplewick Foods Inc. (sample)". No PE wording.                                                                                    |
| B10 | Hollis Street Kitchens (any)           | Independent pin. "Part of Hollis Street Kitchens, a local independent group".                                                                                                       |
| B11 | Any restaurant                         | Wording is neutral: no "controlled by", "bought out", "taken over".                                                                                                                 |

## C. Search and filters

| #   | Steps                               | Expected                                                                               |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| C1  | Search "harb"                       | All Harborline locations listed; pins on map limited to matches. Filter counts update. |
| C2  | Search "cafe" (no accent)           | Finds "Sunmill Bakery Café".                                                           |
| C3  | Search "zzz"                        | "No restaurants match…" message.                                                       |
| C4  | Filter PE-backed                    | Only P pins. Franchised (F) locations are **not** included.                            |
| C5  | Filter Franchise of PE-backed brand | Only F pins.                                                                           |
| C6  | Filter Independent                  | Only I pins (includes Hollis Street Kitchens).                                         |
| C7  | Filter All                          | Also shows E, C and ? pins, which appear under All only.                               |

## D. Near me and alternatives

| #   | Steps                                               | Expected                                                                                                               |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D1  | Fresh install: tap Near me                          | Permission prompt appears **only now**, not at launch.                                                                 |
| D2  | Allow                                               | Map centers on you with a location dot.                                                                                |
| D3  | Deny                                                | Message explains permission is off; app keeps working.                                                                 |
| D4  | Open a PE-backed or PE-franchise restaurant         | "Independent alternatives nearby": same cuisine, nearest first, with distances.                                        |
| D5  | Open Ember & Rye — Downtown (Austin)                | Same-cuisine independent listed: Mesquite Flats, about 1.5 mi / 2.4 km.                                                |
| D5b | Open Ember & Rye — North Loop (Austin)              | No barbecue independent within range, so it says so and lists other independents nearby (Grill Lantern, Morning Loaf). |
| D6  | Tap an alternative                                  | Map moves to it and its details open.                                                                                  |
| D7  | Open an independent, chain or unverified restaurant | No alternatives section.                                                                                               |

## E. PE firm screen

| #   | Steps                                        | Expected                                                                                                                                     |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | In a sheet, tap "Quillmere Capital (sample)" | Firm screen lists Harborline (via Brightplate), Sunmill, Tidewater, with paths, stake, year, location counts, source and last-verified date. |
| E2  | Open Ostravale Partners (sample)             | Current: Ember & Rye. Past: Lotus Lane.                                                                                                      |
| E3  | Holding company names in a chain             | Not tappable (only PE firms have a firm screen).                                                                                             |

## F. About

| #   | Steps      | Expected                                                                                                     |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| F1  | Open About | Sample-data notice; methodology; map key; confidence levels; corrections links; privacy statement; licenses. |

## G. Layout, theme, accessibility

| #   | Steps                                               | Expected                                                                                                                           |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Preview: switch Phone / Desktop                     | Phone: bottom sheet. Desktop: side panel with details in the panel.                                                                |
| G2  | Preview: Theme Light / Dark                         | All text readable in both.                                                                                                         |
| G3  | Web: Tab through the page                           | Search, filters, pins and buttons reachable; pins announce name and type.                                                          |
| G4  | **Native:** VoiceOver (iOS) / TalkBack (Android) on | Pins, groups, filters (selected state), sheet close button and links have spoken labels. Focus moves into the sheet when it opens. |
| G5  | **Native:** largest system text size                | Sheet and About text grow and stay readable; nothing clipped.                                                                      |

## H. Native-only (Expo Go)

| #   | Steps             | Expected                                                        |
| --- | ----------------- | --------------------------------------------------------------- |
| H1  | iOS               | Apple Maps base map; pins and groups render; panning is smooth. |
| H2  | Android           | Google Maps base map; same.                                     |
| H3  | Tap a source link | Opens in the browser.                                           |

## Known limits of the web preview

- When map tiles cannot load (for example inside a sandboxed page), the map shows country and
  state outlines only; at street level the background is blank but pins still work.
- The "Near me" permission flow is a browser prompt, not the native one. Some embedded viewers
  block location entirely; you will then see the "permission is off" message.
