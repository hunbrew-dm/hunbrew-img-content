# hunbrew-img-content

Statikus karakterlap workspace D&D karakterekhez.

## Struktúra

- `character-sheet/character-sheet.html` – generikus karakterlap oldal
- `character-sheet/data/*.json` – karakteradatok külön JSON fájlokban
- `character-sheet/data/compendium/items.json` – lookup-alapú item kompendium
- `character-sheet/data/compendium/spells.json` – generált, renderelésbarát spell kompendium
- `hunbrew-ve-tools/hun-spell.json` – érintetlen forrás spell-adatbázis
- `scripts/build-pages.mjs` – Pages build: index generálás + statikus artifact előállítás
- `.github/workflows/pages.yml` – GitHub Pages deploy workflow

## Karakter hozzáadása

1. Hozz létre egy új JSON fájlt a `character-sheet/data/` mappában.
2. Kövesd a meglévő `valerius-v6.json` szerkezetét.
3. A `spells` mezőben csak varázslatneveket adj meg listában; a részletes spell-adatok a kompendiumból jönnek.
4. Az `equipment` mezőben adj meg item-neveket vagy név + karakter-specifikus override objektumokat; a tárgyadatok lookupból jönnek.
5. Push után a Pages főoldal automatikusan felveszi az új karakter linkjét.

## Lokális build

```bash
npm run build:pages
```

Ez létrehozza a `dist/` mappát a Pages-re publikálható statikus tartalommal.

Mivel a karakterlap JSON-t `fetch()`-sel tölti be, lokálisan érdemes statikus szerverrel megnyitni, például:

```bash
cd dist
python3 -m http.server 4173
```

## Linkelés

A karakteroldalak ugyanazt a generikus HTML-t használják, és a megfelelő adatfájlt query paraméterrel kapják meg:

```text
character-sheet/character-sheet.html?data=data/valerius-v6.json
```

Biztonsági okból a karakterlap csak a `character-sheet/data/` mappából tölt be `.json` fájlt.

