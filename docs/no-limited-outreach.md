# NO LIMITED: request for a link back and confirmation of details

Send to NO LIMITED's marketing contact. Polish first; the English version follows.

---

## Wiadomość (PL)

**Temat:** Mat Atom Deweloper Wrocław × NO LIMITED – strona o naszym sprzęcie i prośba o link

Dzień dobry,

na nowej stronie drużyny Mat Atom Deweloper Wrocław opublikowaliśmy stronę o sprzęcie, na którym się ścigamy. NO LIMITED jest na niej przedstawione jako nasz partner kołowy:

- PL: https://www.atomteam.pl/sprzet/
- EN: https://www.atomteam.pl/en/equipment/

Mamy dwie prośby:

1. **Link zwrotny.** Czy moglibyście wspomnieć o drużynie na swojej stronie (np. w zakładce o zespołach lub sportowcach albo w aktualnościach) i dodać link do jednej z powyższych stron? Poniżej przesyłamy gotowy fragment danych strukturalnych (JSON-LD), który pokazuje wyszukiwarkom i asystentom AI, że NO LIMITED sponsoruje drużynę.
2. **Potwierdzenie szczegółów**, zanim pokażemy je publicznie:
   - preferowany zapis marki (używamy „NO LIMITED”);
   - modele kół, na których jeździ drużyna, wysokość obręczy i dyscypliny (szosa, jazda na czas, tor, MTB);
   - czy możemy napisać, że NO LIMITED produkuje koła z homologacją UCI od 2016 roku;
   - adresy stron produktów dla każdego modelu;
   - logo w formacie SVG.

Dziękujemy za wsparcie w sezonie 2026!

Pozdrawiamy,
[imię i nazwisko], Mat Atom Deweloper Wrocław
kontakt@atomteam.pl

---

## Message (EN)

**Subject:** Mat Atom Deweloper Wrocław × NO LIMITED: our equipment page and a link request

Hello,

The new Mat Atom Deweloper Wrocław website has a page about the equipment we race on, with NO LIMITED featured as our wheel partner:

- PL: https://www.atomteam.pl/sprzet/
- EN: https://www.atomteam.pl/en/equipment/

We have two requests:

1. **A link back.** Could you mention the team on your website (for example on a teams or athletes page, or in your news) and link to one of the pages above? Below is a ready-made structured-data (JSON-LD) snippet that tells search engines and AI assistants that NO LIMITED sponsors the team.
2. **Confirmation of details** before we show them publicly:
   - your preferred brand spelling (we use "NO LIMITED");
   - the wheel models the team rides, their rim depths and disciplines (road, time trial, track, MTB);
   - whether we may say NO LIMITED has made UCI-approved wheels since 2016;
   - a product page URL for each model;
   - your logo as an SVG.

Thank you for your support in 2026!

Best regards,
[name], Mat Atom Deweloper Wrocław
kontakt@atomteam.pl

---

## JSON-LD for no-limited.pl

Paste this into the `<head>` of the page that mentions the team. The team's `@id` matches the one on atomteam.pl, so search engines join the two descriptions into one entity.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "Brand"],
      "@id": "https://no-limited.pl/#organization",
      "name": "NO LIMITED",
      "url": "https://no-limited.pl/",
      "description": "Polish manufacturer of carbon bicycle wheels from Podkarpacie."
    },
    {
      "@type": "SportsTeam",
      "@id": "https://www.atomteam.pl/#team",
      "name": "Mat Atom Deweloper Wrocław",
      "url": "https://www.atomteam.pl/",
      "sport": "Cycling",
      "sponsor": {
        "@type": "Role",
        "roleName": "Wheel partner",
        "sponsor": { "@id": "https://no-limited.pl/#organization" }
      },
      "subjectOf": {
        "@type": "WebPage",
        "name": "What wheels does Mat Atom Deweloper Wrocław ride?",
        "url": "https://www.atomteam.pl/en/equipment/"
      }
    }
  ]
}
</script>
```

After it's live, check it at https://validator.schema.org/.
