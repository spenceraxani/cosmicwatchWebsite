# Writing, design and code rules

This site is a university research program's public face. These rules keep it from reading as generated. They are a filter, not a style: the look comes from the CosmicWatch logo, the detector itself and ScrewFast's components.

Run `pnpm audit:style` before a commit. It counts the patterns below in `src/`. Not every hit is wrong, but every hit needs a reason.

Sources the rules are taken from:

- [blader/humanizer](https://github.com/blader/humanizer), from Wikipedia's "Signs of AI writing"
- [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) (copywriting, UI and code-comment skills)
- [Eid0lon/zero-slop](https://github.com/Eid0lon/zero-slop) (`no-slop` pattern database)
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (rendered-page anti-pattern rules)
- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- [anthropics/skills, frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- deslop commands ([dabit3/deslop](https://github.com/dabit3/deslop) and others)

## Writing

- Say what the thing is or does. No "seamless", "powerful", "unlock", "journey", "landscape", "cutting-edge" and the like.
- No em dashes. Use a comma, colon, full stop or parentheses.
- No "not just X, but Y", "from X to Y" ranges that list nothing, or closing one-liners that sound wise.
- Lists of three only when there are three things. Do not pad to three.
- No middle-dot metadata strings (`A · B · C`). Write a short sentence or use separate cells.
- Sentence case for headings and labels. Straight quotes and apostrophes.
- No visible placeholders or TODOs. Leave a TODO in a code comment, never in copy.
- Numbers come from a source (the v3X paper, the lab's data). No invented stats or social proof.
- Buttons say what happens: "Load sample", "Send order request", not "Get started".

## Design

- One panel style: the `surface` utility in `global.css`. No card shadows, no card inside a card.
- No accenting one word of a headline in a different color.
- No uppercase tracked labels above headings or in table headers.
- No arrow glued to every button. An arrow means "goes somewhere else", and only where that helps.
- No decorative shapes, glows, gradients or glass behind content.
- No hover zoom or lift on cards. Hover changes color or underline.
- Stats only when they help someone decide something, weighted by importance, not four equal tiles.
- Icons come from `CwIcon` (drawn from the detector). One icon set.
- Numbered steps only for a real sequence (the muon-to-data-file chain is one).

## Motion

- Entrance motion comes from `tailwindcss-motion`, triggered by `tailwindcss-intersect`. Use the tokens in `src/utils/motion.ts` (`reveal`, `revealImage`, `delay(i)`). Do not write new keyframes.
- One short entrance per block (450 ms, 12 px), once. Stagger items in a row by 60 ms, capped at 300 ms.
- No looping, pulsing or bouncing. Nothing moves that the reader did not scroll to or click.
- `prefers-reduced-motion` turns all of it off (`global.css`).
- Page changes cross-fade with native view transitions. No smooth-scroll library.

## Code

- A comment says why, or names a constraint the code cannot show. One line, two at most.
- No banner comments, step narration, or comments that repeat the next line or the function signature.
- `try/catch` only at a trust boundary: network, storage, clipboard, the serial port, user files.
- No `as any`. Type the value or narrow it.
- Delete unused components and copy; do not keep them "for later".
