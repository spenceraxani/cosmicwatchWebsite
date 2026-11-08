# CosmicWatch website

The website for **CosmicWatch**, the desktop muon detector program at the University of Delaware.

Built on the [ScrewFast](https://github.com/mearashadowfax/ScrewFast) template (Astro 7, Tailwind CSS 4, Preline, Starlight; MIT license, see `LICENSE`). The template's design is kept as is, with one change: the floating rounded header is now a normal full-width sticky header, on both the main site and the docs.

## Pages

| Route | What it is | Edit it in |
| --- | --- | --- |
| `/` | Home | `src/views/HomeView.astro`, text in `src/copy/en.ts` (`home`) |
| `/about` | History and papers | `src/views/AboutView.astro`, `src/data_files/papers.ts` |
| `/detector` | v3X specs, parts, gallery | `src/views/DetectorView.astro`, `src/data_files/detector.ts` |
| `/docs/...` | How it works, build guide, 20 measurements, troubleshooting | Markdown in `src/content/docs/docs/` |
| `/software` | GUI, firmware, scripts, in-browser reader | `src/views/SoftwareView.astro` |
| `/news` | News posts | One Markdown file per post in `src/content/blog/en/` |
| `/people` | Team and sponsors | `src/data_files/people.ts` |
| `/purchase` | Buy a detector, parts list | `src/views/PurchaseView.astro`, `src/data_files/bom.json` |
| `/github` | Live repository activity | `src/views/GitHubView.astro` |
| `/contact` | Contact form (opens email) and FAQ | `src/data_files/faqs.json` |

All page text lives in `src/copy/en.ts`. Search the project for `TODO` to find placeholders that need real content from the lab.

## Run it

```bash
npm install -g pnpm   # once
pnpm install
pnpm dev              # http://localhost:4321
pnpm build            # type-checks, then builds the static site into dist/
pnpm test:smoke       # serves dist/ and checks every route
```

## Add a news post

Copy one of the files in `src/content/blog/en/`, change the front matter (title, description, date, card image) and write the post. Keep it short and dated; nothing on the home page needs editing.

## Images

Photos and renders are in `src/images/cw/`. They come from the CosmicWatch v3X GitHub repo (`Pictures/`, `PCB/`, `Enclosure/`) and from figures in the four manuals. People have no photos yet; the cards show initials. To add one, drop the photo in `src/images/people/` and set `photo` in `src/data_files/people.ts`.

## Guide sync

The four PDF manuals in the v3X repository are also published as web pages under `/docs/guides/`, one page per chapter (the long "Tested Measurements" chapter gets one page per measurement).

- `scripts/sync-guides.py --repo <clone of the v3X repo>` converts the PDFs. It writes the pages to `src/content/docs/docs/guides/`, the figures to `public/guides/`, and a manifest to `src/data_files/guides.json`. Do not edit those by hand; rerun the script. It needs `pip install pymupdf pillow`.
- Each page records the git SHA of the PDF it came from. When someone opens a page, it asks the GitHub API whether the PDF has changed and, if so, says so and links the newer PDF (`src/assets/scripts/guideSync.ts`).
- `.github/workflows/sync-guides.yml` checks the v3X repository every day and on demand. If a PDF changed, it reruns the script and commits the new pages, and the normal deploy publishes them.
- To sync right after a PDF is pushed, the v3X repository can send a `repository_dispatch` event of type `v3x-updated` to this repository (for example from its own workflow with a token that can write here).
- The summary pages (`/docs/build/`, `/docs/measurements/` and so on) end with a "Full text" note that links the matching guide section. Those links come from a one-off script; if a chapter is renamed in the PDF, check them.

## Deploy at UD

`pnpm build` produces plain HTML, CSS and JavaScript in `dist/`, so it runs on any static host, including UD's static web hosting (copland.udel.edu) or a vendor host on an approved udel.edu address.

1. Set `SITE_URL` in `astro.config.mjs` (and `base` if the site lives in a sub-folder).
2. `pnpm build`
3. Upload the contents of `dist/` to the web folder.

Before going live:

- Payments: UD's Interim Payment Card Policy 3-26 requires approved payment tools. Ask merchantsupport@udel.edu before adding PayPal. Until then, the Buy page opens an email.
- Keep `sites.udel.edu/cosmicwatch` working or redirect it here, because the JINST v3X paper links to it.
- UD requires WCAG 2.1 AA. Re-check colour contrast if you change the palette.

## Credits

Template: ScrewFast by Emil Gulamov (MIT). Detector designs, photos and manuals: © University of Delaware, Prof. Spencer N.G. Axani, CC BY-NC 4.0.
