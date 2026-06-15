# anicca

> **अनिच्च** · *anicca* — Pali for **impermanence**. All that arises, passes.

A live meditation on finite time. Not a death-countdown — a quiet reminder of the
waking, meaningful hours you *still have*, rendered as light against the dark.

The same engine, three **lenses**:

- **life** — the waking hours left in your own life
- **stillness** — the hours of meditation still ahead, if you sit each day
- **together** — the waking hours you have left to actually spend with someone you love

The number streams in real time; the present moment dissolves in the decimals.
Behind it, a field of motes **arises and passes** — the flux you watch on the cushion.
On the *stillness* lens, the whole page breathes.

## Use it

Open `index.html`. That's it — it's a single static page, no build step, no
dependencies. Switch lenses with the words at the bottom (or keys `1` / `2` / `3`).

### Make it yours

Hit **tune** (top-right) and edit the numbers — they recompute live, persist in
your browser, and write themselves into the URL so any configuration is shareable.

You can also set everything by query string:

```
index.html?youBorn=1992&herBorn=1990&herName=<name>&sleep=8&work=8&personal=2&meditation=2&togetherToAge=60&toAge=80
```

| param           | meaning                                   | default |
| --------------- | ----------------------------------------- | ------- |
| `youBorn`       | your birth year                           | 1992    |
| `herBorn`       | their birth year                          | 1990    |
| `herName`       | their name (shown on the *together* lens) | `<name>` |
| `sleep`         | hours of sleep per day                    | 8       |
| `work`          | hours of work per day                     | 8       |
| `personal`      | hours of upkeep per day (shower, etc.)    | 2       |
| `meditation`    | hours of stillness per day                | 2       |
| `togetherToAge` | age you both at least reach (binds on the elder) | 60 |
| `toAge`         | a realistic life horizon                  | 80      |
| `lens`          | which lens to open on — `life` · `stillness` · `anu` | anu |

Every lens is directly linkable — switch lenses and the URL updates live, so you
can send someone straight to, say, `…/anicca?lens=stillness`.

> **The math.** Waking hours = `(24 − sleep)` per day. Together hours =
> `(24 − sleep − work − personal)` per day. Each lens multiplies its daily hours by
> the days left until its horizon. The *together* horizon binds on whoever reaches
> `togetherToAge` first.

## Deploy to GitHub Pages

```
git init && git add . && git commit -m "anicca"
git branch -M main
git remote add origin git@github.com:NISH1001/anicca.git
git push -u origin main
```

Then **Settings → Pages → Source: `main` / root**. Live at
`https://nish1001.github.io/anicca`.

## Privacy note

The committed defaults include a name and birth years. Since the repo is public,
you may prefer to ship neutral defaults (e.g. blank the name) and keep your real
numbers in the URL / your own browser only. Your call — it's your page.

---

*Built with intention, not slop. Fraunces + IBM Plex Mono, vanilla JS, a canvas, and the dark.*
