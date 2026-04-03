
# 📜 Projekt Összefoglaló: Magyar D&D Karakterlap Dashboard

## 🎯 Célkitűzés
Egy egyetlen HTML fájlból álló, reszponzív, magyar nyelvű D&D karakterlap és session tracker létrehozása. Elsődleges szempont a mobil-barát használat játék közben, miközben asztali nézetben is jól áttekinthető dashboard maradjon.

## 🛠 Technikai Elvárások
* **Technológia:** Single File (HTML5, CSS3, Vanilla JS). Nincs külső függőség (kivéve Google Fonts).
* **Adattárolás:** `localStorage` használata a munkamenet mentéséhez (`hp`, `thp`, resource állapotok, feature counterek, hit dice használat).
* **Adatszerkezet:** Minden karakteradat egy központi `sheetData` objektumban van definiálva a script elején a könnyű szerkeszthetőségért.
* **Design:** Sötét mód, magas kontraszt, mobilon is jól olvasható tipográfia. A jelenlegi fontpár: **Noto Sans** + **Noto Serif**.

---

## 📈 Jelenlegi Funkciók

1. **Harcerőpont kezelő:** nagy méretű aktuális HP mező, temp HP badge, pozitív léptetős mennyiségmező, `Sebzés / Gyógyítás / Ideiglenes` gombok.
2. **Halálsikerek:** ha a HP 0-ra csökken, külön success / fail blokk jelenik meg.
3. **Hit dice kezelő:** külön sorban látható, buborékokkal jelölhető, rövid / hosszú pihenő logikával együtt használható.
4. **Képességpróbák és mentődobások:** külön blokkok, kattintható dobással.
5. **Fejlett skill modell:** a skillek támogatják a `nincs`, `fél jártasság`, `jártasság`, `expertise` állapotokat.
6. **Erőforrások és feature counterek:** buborékos jelölés, részleges short rest refill támogatással.
7. **Varázslat blokkok:** szintenként csoportosított spell dobozok, dedikált metaadatokkal (iskola, hatótáv, hatóidő, varázslási idő, komponensek, koncentráció, rituálé, opcionális DC/attack).
8. **Dobásrendszer:** kattintható statok, skillek, mentődobások, támadások és hit dice; lebegő ikonról nyitható history panel; gyors d4/d6/d8/d10/d12/d20 dobások; 10 másodperces utolsó-dobás modal a nem quick-roll dobásokhoz.
9. **Pihenés logika:** `Rövid Pihenő` és `Hosszú Pihenő` külön gombokkal.

---

## 🏗 Aktuális Adatstruktúra

A script az alábbi objektumot használja (példa):

```javascript
const sheetData = {
    id: "unique_id_for_storage",
    name: "Character Name",
    raceClass: "Race | Class Level",
    ac: 16,
    init: "+3",
    prof: "+3",
    hpMax: 42,
    hitDice: { total: 5, die: "d8" },
    stats: [
        { label: "STR", val: 10, mod: "+0" }
        // ...további statok
    ],
    savingThrows: [
        { statIndex: 0, p: false }
        // ...további mentődobások
    ],
    skills: [
        { n: "Arcana", a: "INT", statIndex: 3, s: 1, p: true }
        // ...további skillek
    ],
    attacks: [
        { n: "Attack Name", b: "+7", d: "1d8+4" }
        // ...további támadások
    ],
    resources: [
        { label: "Varázslat rekesz", count: 2, shortRest: 2 }
        // ...további erőforrások
    ],
    spells: [
        {
            level: 1,
            name: "Boszorkány átok",
            school: "Ráolvasás",
            castTime: "1 bónusz akció",
            range: "90 láb",
            duration: "1 óra",
            components: "V, S, M (...)",
            concentration: true,
            ritual: false,
            dc: 15,
            atk: "+7",
            desc: "Leírás..."
        }
    ],
    features: [
        { title: "Feature", description: "Leírás", count: 3, shortRest: 2 }
        // ...további feature-ök
    ]
};
```

### Skill rang (`skills[].s`)
- `0` → nincs jártasság
- `0.5` → fél jártasság
- `1` → jártasság
- `2` → expertise

### Runtime állapot
- `tempHP`
- `deathSaves`
- `featureCounters`
- `hitDiceSpent`
- `rollHistory`
- `lastRollTimer`

### Perzisztált állapot (`localStorage`)
```javascript
{
  hp,
  thp,
  checked,
  featureChecked,
  hitDiceSpent
}
```

Megjegyzés: a `deathSaves` és a dobástörténet jelenleg nem perzisztálódik.

---

## 🔎 Fontos Implementációs Megjegyzések
* A projekt továbbra is egyetlen HTML fájlban működik; ne vezess be build stepet vagy külső runtime függőséget, ha nem szükséges.
* A spell-boxok jelenleg nem töltik be automatikusan a `hunbrew-ve-tools/hun-spell.json` teljes adatbázisát; a fájl inkább referencia a mezőnevekhez és a magyar terminológiához.
* A `render()` és segédfüggvényei `innerHTML +=` mintát használnak; újrarenderelés előtt a konténert üríteni kell.
* A dobópanel és az utolsó dobás modal külön UI rétegek; quick roll esetén nincs last-roll modal.

---
*Ez a dokumentum a jelenlegi, kibővített karakterlap állapotát írja le.*
