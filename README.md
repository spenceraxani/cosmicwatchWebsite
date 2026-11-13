# CosmicWatch website

The website for **CosmicWatch: The Desktop Muon Detector (v3X)**, the education and outreach program run by the Department of Physics and Astronomy at the University of Delaware.

Built with Astro 7, Tailwind CSS 4 and Starlight (for the guides), on the [ScrewFast](https://github.com/mearashadowfax/ScrewFast) template (MIT license, see `LICENSE`).

## Pages

| Route           | What it is                                                                    | Edit it in                                                                               |
| --------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/`             | Home                                                                          | `src/views/HomeView.astro`, text in `src/copy/en.ts` (`home`)                            |
| `/detector`     | The v3X: specs, parts, photos, papers                                         | `src/views/DetectorView.astro`, `src/data_files/detector.ts`, `src/data_files/papers.ts` |
| `/measure`      | Plot data from a detector on USB or a data file, download CSV or a PDF report | `src/views/MeasureView.astro`, `src/scripts/measure/`                                    |
| `/github`       | Downloads: GUI, firmware, scripts, and the v3X repository on GitHub           | `src/views/GitHubView.astro`                                                             |
| `/shop`         | Buy a detector (links to an outside store; UD pages take no payments)         | `src/views/ShopView.astro`, `src/data_files/shop.ts`                                     |
| `/contact`      | Contact form, people and FAQ                                                  | `src/views/ContactView.astro`, `src/data_files/people.ts`, `src/data_files/faqs.json`    |
| `/docs/`        | Guides: the four v3X manuals as web pages, and the Parts List & BOM           | `src/content/docs/docs/`                                                                 |
| `/pdf/<guide>/` | The newest PDF of each manual, loaded from GitHub                             | `src/pages/pdf/[slug].astro`                                                             |

All page text is in `src/copy/en.ts`.

## Run it

```bash
npm install -g pnpm   # once
pnpm install
pnpm dev              # http://localhost:4321
pnpm build            # type-checks, then builds the static site into dist/
pnpm test:smoke       # serves dist/ and checks every page
```

On the dev server a small panel in the bottom-left corner switches between the two home page heroes (Photo / Old) and the two navigation bars (Bar / Bubble). It is not part of a build. To ship it, set `TOGGLES_ON` in `src/utils/designToggles.ts`.

## What updates itself

- **Guides.** `scripts/sync-guides.py --repo <clone of the v3X repo>` turns the four PDF manuals into one web page per chapter (pages in `src/content/docs/docs/guides/`, figures in `public/guides/`, manifest in `src/data_files/guides.json`). Do not edit those by hand. `.github/workflows/sync-guides.yml` checks the v3X repository every day; if a PDF changed, it reruns the script and commits the new pages. The v3X repository can also trigger it at once with a `repository_dispatch` event of type `v3x-updated`. Needs `pip install pymupdf pillow`.
- **Downloads.** The firmware link and last change date are checked against the GitHub API each time the page opens. The commit list comes from `scripts/github-snapshot.mjs` at build time.
- **Not automatic:** the Parts List & BOM (`src/data_files/bom.json`, from `Purchasing_List_v3X_sa.xlsx`), the papers, people and FAQ.

## Contact form

The form posts to UD's Forms Data Processor once the form is registered. Until then, Send opens an email to saxani@udel.edu. Steps: `docs/contact-form-setup.md`. Then set `CONTACT_FDP_FORM_ID` in `src/data_files/navigation.ts`.

## Shop

Set `STORE_URL` in `src/data_files/shop.ts` when the store exists. Until then the buttons say "Available soon".

## Deploy

`pnpm build` produces plain HTML, CSS and JavaScript in `dist/`, so it runs on any static host. `vercel.json` is set up for Vercel. For a UD address, set `SITE_URL` (and `base` for a sub-folder) in `astro.config.mjs`, build, and upload `dist/`.

- Keep `sites.udel.edu/cosmicwatch` working or redirect it here, because the v3X paper links to it.
- UD requires WCAG 2.1 AA. Re-check colour contrast if the palette changes.

## Credits

Template: ScrewFast by Emil Gulamov (MIT). Detector designs, photos and manuals: University of Delaware, Prof. Spencer N. Axani, CC BY-NC 4.0.
