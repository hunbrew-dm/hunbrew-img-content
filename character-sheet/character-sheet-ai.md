
# 📜 Projekt Összefoglaló: Arcane Dashboard D&D Session Tracker

## 🎯 Célkitűzés
Egy egyetlen HTML fájlból álló, reszponzív, vizuálisan "arcane/fantasy" stílusú D&D karakterlap és session tracker létrehozása. Elsődleges szempont a mobil-barát használat (játék közbeni gyors elérés) és a PC-s átlátható "Dashboard" nézet.

## 🛠 Technikai Elvárások
* **Technológia:** Single File (HTML5, CSS3, Vanilla JS). Nincs külső függőség (kivéve Google Fonts).
* **Adattárolás:** `localStorage` használata a munkamenet mentéséhez (HP, elhasznált spell slotok).
* **Adatszerkezet:** Minden karakteradat egy központi `sheetData` objektumban van definiálva a script elején a könnyű szerkeszthetőségért.
* **Design:** Sötét mód, nagy kontrasztú "Glowing Arcane" esztétika, Cinzel Decorative és Metamorphous fontok.

---

## 📈 Fejlesztési Mérföldkövek (Prompt Előzmények)

1.  **Alapfunkciók:** Interaktív HP mező, kattintható (beikszelhető) Spell Slot buborékok és egy "Long Rest" gomb, ami mindent alaphelyzetbe állít.
2.  **Mobil Optimalizálás:** * PC-n 3 oszlopos elrendezés (Stats | Combat | Resources).
    * Mobilon egy oszlopos nézet, érintés-barát (min. 32px) gombokkal és buborékokkal.
    * **Sticky Vitals:** Mobilon az AC, Init és Proficiency mezők a képernyő tetejére tapadnak görgetéskor.
3.  **Skill Blok:** A HP tracker alá egy kétoszlopos (PC) / egyoszlopos (Mobil) skill lista került, amely jelöli a Proficiency-t és a bónuszokat.
4.  **Taktikai HP Controller:** * Külön beviteli mező (stepperrel) a változásokhoz.
    * **Heal/Damage/Temp** gombok.
    * **Logika:** A sebzés (Damage) automatikusan a Temporary HP-ból vonódik le először. A gyógyítás (Heal) nem lépheti át a maximum HP-t.
5.  **Vizuális Hierarchia Finomhangolása:** * A jelenlegi HP extrém nagy (`5.5rem`), a Max HP pedig jól olvasható szürke színű lett.
    * **Temp HP Badge:** A Temporary HP nem sima szöveg, hanem egy világító kék "badge" formájában jelenik meg a jobb felső sarokban, ha az értéke > 0.

---

## 🏗 Aktuális Adatstruktúra (v6)

A script az alábbi objektumot használja (példa):

```javascript
const sheetData = {
    id: "unique_id_for_storage",
    name: "Character Name",
    raceClass: "Race | Class Level",
    ac: 16, init: "+3", prof: "+3", hpMax: 42,
    stats: [ { label: "STR", val: 10, mod: "+0" }, ... ],
    skills: [ { n: "Arcana", b: "+4", p: true }, ... ],
    attacks: [ { n: "Attack Name", b: "+7", d: "1d8+4" }, ... ],
    resources: [ { label: "Spell Slots", count: 3 }, ... ],
    features: "String with \n line breaks"
};
```

---

## 🚀 Következő lépéseknek javasolt
* **Inventory kezelő:** Egyszerű tárgylista hozzáadása.
* **Dice Roller:** Kattintásra dobás a skilleknél vagy támadásoknál.
* **Több karakter:** Karakterváltó funkció (több `localStorage` kulcs kezelése).

---
*Ez a dokumentum a v6-os verzió alapján készült.*