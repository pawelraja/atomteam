import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date written as YYYY-MM-DD, e.g. "2027-03-14"')
  .refine((s) => !Number.isNaN(Date.parse(s + 'T00:00:00Z')), 'is not a real calendar date');

const seasonYear = z.number().int().min(2016).max(2100);
const seasons = z.array(seasonYear).min(1, 'needs at least one season, e.g. [2027]');
const countryCode = z
  .string()
  .regex(/^[A-Z]{3}$/, 'must be a three-letter country code in capitals, e.g. "POL"');

/** Text in both languages. Polish is the source; English must be present too. */
export const localized = z
  .object({ pl: z.string().min(1, 'Polish text is empty'), en: z.string().min(1, 'English text is empty') })
  .strict();

const phone = z.string().regex(/^\+?[0-9 ()-]{6,20}$/, 'must be a phone number like "+48 600 000 000"');

/** A named contact person. Any field may be left out; the card only appears with a name and an e-mail or phone. */
export const contactSchema = z
  .object({
    name: z.string().min(1).nullable().optional(),
    role: localized.nullable().optional(),
    phone: phone.nullable().optional(),
    email: z.email('must be an e-mail address').nullable().optional(),
    /** Portrait file in src/assets/riders/, e.g. "pawel-bentkowski.jpg". */
    photo: z.string().min(1).nullable().optional(),
    /** Promised response time, e.g. { "pl": "w ciągu 24 godzin w dni robocze", "en": "within 24 hours on weekdays" }. */
    responseTime: localized.nullable().optional(),
  })
  .strict();

export const PHASES = ['preseason', 'racing', 'offseason'] as const;

export const siteSchema = z.object({
  currentSeason: seasonYear,
  /** The date the roster and other headline facts were last checked: answers say "as of <date>". */
  factsAsOf: isoDate,
  phase: z.enum(PHASES),
  rosterConfirmed: z.boolean(),
  calendarConfirmed: z.boolean(),
  partnersConfirmed: z.boolean(),
  teamPresentation: z
    .object({
      date: isoDate,
      place: z.string().min(1),
      url: z.url().nullable().optional(),
    })
    .nullable(),
  /** One line in the plum bar above the header, e.g. "Sezon 2027 · Kalendarz wstępny online". Null hides the bar. */
  statusLine: localized.nullable(),
  /** Link at the end of the status bar. "href" is a page name (home, team, calendar, partners, media) or a full URL. */
  statusLink: z.object({ label: localized, href: z.string().min(1) }).strict().nullable(),
  pressContact: contactSchema.nullable(),
});

export const DISCIPLINES = ['ROAD', 'TRACK', 'CX', 'TTT', 'MTB'] as const;
export const STATUSES = ['confirmed', 'tbc', 'cancelled'] as const;

export const calendarEntrySchema = z
  .object({
    /** Event id from the results workbook (e.g. "E14"), or any unique slug. Results refer to it. */
    id: z
      .string()
      .regex(/^[A-Za-z0-9-]+$/, 'may only use letters, digits and dashes')
      .optional(),
    start: isoDate.optional(),
    end: isoDate.optional(),
    month: z.number().int().min(1).max(12).optional(),
    name: z.string().min(1),
    name_en: z.string().min(1).optional(),
    /** Short name for running text, e.g. "Scheldeprijs". */
    short: z.string().min(1).optional(),
    location: z.string().min(1).nullable(),
    location_en: z.string().min(1).optional(),
    country: countryCode.nullable(),
    discipline: z.enum(DISCIPLINES),
    class: z.string().min(1).nullable(),
    status: z.enum(STATUSES),
    type: z.enum(['race', 'training']).optional(),
    /** false = a race riders did outside the published team calendar (kept for results only). */
    onTeamCalendar: z.boolean().optional(),
    /** A national championship: its podiums count as titles and medals. */
    nationalChampionship: z.boolean().optional(),
    note: z.string().min(1).optional(),
    result: z.string().min(1).optional(),
    url: z.url().optional(),
    /** Address of the race page, e.g. "nxt-classic". Made from the name when left out. */
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'may only use lowercase letters, digits and dashes')
      .optional(),
    /** Wheels raced here, when it differs from the season default in equipment.json; false = not the team's wheels (e.g. national team). */
    equipment: z.object({ wheels: z.union([z.string().min(1), z.literal(false)]) }).strict().optional(),
    /** Who runs the race, for structured data. Leave out until known. */
    organizer: z.object({ name: z.string().min(1), url: z.url().optional() }).strict().optional(),
    verify: z.boolean().optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    // Races outside the team calendar only need to exist for results; dates may be unknown.
    if (e.onTeamCalendar === false) return;
    if (e.country === null) {
      ctx.addIssue({ code: 'custom', message: '"country" is needed for races on the team calendar' });
    }
    if (e.status === 'confirmed' && (!e.start || !e.end)) {
      ctx.addIssue({
        code: 'custom',
        message: 'a "confirmed" race needs both "start" and "end" dates. If dates are not known yet, use "status": "tbc" with a "month" instead',
      });
    }
    if ((e.start && !e.end) || (!e.start && e.end)) {
      ctx.addIssue({ code: 'custom', message: 'give both "start" and "end" (use the same date for one-day races)' });
    }
    if (e.start && e.end && e.end < e.start) {
      ctx.addIssue({ code: 'custom', message: `"end" (${e.end}) is before "start" (${e.start})` });
    }
    if (!e.start && e.month === undefined) {
      ctx.addIssue({ code: 'custom', message: 'needs either "start"/"end" dates or a "month" (1–12)' });
    }
  });

export const partnerSchema = z
  .object({
    name: z.string().min(1),
    url: z.url(),
    tier: z.enum(['title', 'main', 'technical', 'institutional']),
    logo: z.string().regex(/^[a-z0-9-]+\.(svg|png|webp)$/, 'must be a file name like "budus.svg"'),
    /** Shorter display name, e.g. { "pl": "Klub Pro · MSiT", "en": "Club Pro · Ministry of Sport" }. */
    label: localized.optional(),
    description: localized.optional(),
    /** "brand" for a product brand (e.g. Sidi, Vittoria, supplied through its distributor), otherwise a company. */
    kind: z.enum(['organization', 'brand', 'manufacturer']).optional(),
    /** Other confirmed addresses of the same company (Wikipedia, LinkedIn, Instagram…), for structured data. */
    sameAs: z.array(z.url()).optional(),
    seasons,
  })
  .strict();

export const CATEGORIES = ['U19', 'U23', 'Elite'] as const;

/** A fact the team has not yet confirmed stays in data with "verify": true and is never shown or emitted. */
const checkedUrl = z.object({ url: z.url().nullable(), verify: z.boolean(), note: z.string().optional() }).strict();

export const PROFILE_SITES = ['procyclingstats', 'firstcycling', 'uci'] as const;
/** External profiles of a rider; null until known. */
export const riderProfilesSchema = z
  .object({
    procyclingstats: z.url().nullable(),
    firstcycling: z.url().nullable(),
    uci: z.url().nullable(),
    /** true until the team has checked every link above. */
    verify: z.boolean(),
  })
  .strict();

export const riderSchema = z
  .object({
    name: z.string().min(1),
    nat: countryCode,
    squad: z.enum(['continental', 'junior']),
    /** Age category: "U19" (juniors), "U23" or "Elite". */
    category: z.enum(CATEGORIES),
    instagram: z
      .string()
      .regex(/^[A-Za-z0-9._]+$/, 'is the Instagram handle only, without @ or https://')
      .nullable()
      .optional(),
    photo: z.string().min(1),
    role: localized.optional(),
    /** Web address of the profile page, e.g. "eliza-rabazynska". Made from the name when left out. */
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'may only use lowercase letters, digits and dashes')
      .optional(),
    bio: localized.optional(),
    /** Full results list on an external site (CyclingFlash etc.). */
    resultsProfile: z.url().optional(),
    /** ProCyclingStats, FirstCycling and UCI profile pages. */
    profiles: riderProfilesSchema.optional(),
    seasons,
    new: z.boolean().optional(),
    /** Internal note for the team; never shown. */
    note: z.string().optional(),
  })
  .strict();

export const staffSchema = z
  .object({
    name: z.string().min(1),
    role: localized,
    photo: z.string().min(1),
    instagram: z.string().regex(/^[A-Za-z0-9._]+$/).nullable().optional(),
    /** What the person does, for structured data: coaches and directors are listed as the team's coaches. */
    function: z.enum(['director', 'coach', 'manager', 'mechanic', 'medical', 'other']).optional(),
    seasons,
  })
  .strict();

export const highlightSchema = z
  .object({
    title: localized,
    text: localized,
    photo: z.string().min(1),
    alt: localized,
    verify: z.boolean().optional(),
  })
  .strict();

export const gallerySchema = z
  .object({
    /** Where the photo appears: "story" (the big gallery), "band" (a full-width photo break), "strip" (the strip above the ticker). */
    use: z.enum(['story', 'band', 'strip']).default('story'),
    photo: z.string().min(1),
    aspect: z.enum(['3:4', '4:3', '16:9']),
    feature: z.boolean().optional(),
    alt: localized,
    race: localized,
    place: localized,
    credit: z.string().min(1),
  })
  .strict();

/** One row per rider per classification, exactly as exported from the results workbook. */
export const resultSchema = z
  .object({
    /** Id of the event in calendar/<year>.json, e.g. "E33". */
    eventId: z.string().min(1),
    date: isoDate.nullable(),
    /** Stage or discipline as written in the workbook, e.g. "Stage 2", "ITT", "Team pursuit". */
    stage: z.string().min(1),
    category: z.string().min(1),
    /** Exactly as written in riders.json. */
    rider: z.string().min(1),
    position: z.number().int().min(1).nullable(),
    status: z.enum(['Classified', 'DNF', 'DNS', 'DSQ', 'LAP', 'OTL']),
    note: z.string().nullable(),
    source: z.url(),
    /** Shown in the selected-results table on the home page. */
    featured: z.boolean(),
    /** true until the team signs the row off ("Checked by team" in the workbook). */
    verify: z.boolean(),
  })
  .strict();

const fileName = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/, 'must be a file name in public/media/ like "madw-logotypy.zip" (lowercase, no spaces)');

export const MEDIA_CATEGORIES = ['race', 'track', 'portrait', 'team'] as const;

export const mediaSchema = z
  .object({
    files: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9-]+$/, 'may only use lowercase letters, digits and dashes'),
          name: localized,
          description: localized,
          /** One file for both languages, or { "pl": "…", "en": "…" } for language versions. */
          file: z.union([fileName, z.object({ pl: fileName, en: fileName }).strict()]),
          format: z.string().min(1),
          status: z.enum(['ready', 'soon']),
        })
        .strict(),
    ),
    photos: z.array(
      z
        .object({
          file: z.string().min(1),
          category: z.enum(MEDIA_CATEGORIES),
          caption: localized,
          credit: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

/** src/data/team.json: the one place for the team's identity facts. */
export const teamSchema = z
  .object({
    name: z.string().min(1),
    officialName: z.object({ value: z.string().min(1), verify: z.boolean(), note: z.string().optional() }).strict(),
    shortName: z.string().min(1),
    alternateNames: z.array(z.string().min(1)),
    wordmark: z.object({ lead: z.string(), a: z.string(), b: z.string() }).strict(),
    uciCode: z
      .object({
        value: z.string().regex(/^[A-Z]{3}$/, 'is a three-letter UCI code, e.g. "ABC"').nullable(),
        candidates: z.array(z.string()).optional(),
        verify: z.boolean(),
        note: z.string().optional(),
      })
      .strict(),
    uciStatus: z.object({ label: z.string().min(1), category: z.string().min(1), verify: z.boolean(), note: z.string().optional() }).strict(),
    founded: seasonYear,
    city: z.string().min(1),
    region: z.string().min(1),
    country: z.string().regex(/^[A-Z]{2}$/, 'is a two-letter country code, e.g. "PL"'),
    sport: z.string().min(1),
    gender: z.enum(['Female', 'Male', 'Mixed']),
    squads: z.array(z.enum(['continental', 'junior'])),
    categories: z.array(z.enum(CATEGORIES)),
    disciplines: z.array(z.enum(DISCIPLINES)),
    website: z.url(),
    contact: z.object({ email: z.email(), phone: phone.nullable() }).strict(),
    hashtag: z.string().min(1),
    social: z.object({ instagram: z.url(), facebook: z.url(), linkedin: z.url() }).strict(),
    profiles: z
      .object({
        wikipediaPl: checkedUrl,
        wikipediaEn: checkedUrl,
        wikidata: checkedUrl,
        procyclingstats: checkedUrl,
        firstcycling: checkedUrl,
        uci: checkedUrl,
      })
      .strict(),
  })
  .strict();

export const EQUIPMENT_CATEGORIES = ['bikes', 'wheels', 'tyres', 'shoes', 'helmets', 'saddles', 'clothing', 'lubricants', 'tools', 'nutrition', 'car'] as const;

/** src/data/equipment.json: the race setup. Every "partner" must match a name in partners.json. */
export const equipmentSchema = z
  .object({
    wheels: z
      .object({
        partner: z.string().min(1),
        /** Seasons the team raced on these wheels. */
        seasons,
        /** Disciplines raced on them; results in these disciplines can mention the wheels. */
        disciplines: z.array(z.enum(DISCIPLINES)).min(1),
        /** true until the team confirms which disciplines are raced on these wheels. */
        disciplinesVerify: z.boolean(),
        about: localized,
        facts: z.array(z.object({ label: localized, value: localized, verify: z.boolean(), note: z.string().optional() }).strict()),
        models: z.array(
          z
            .object({
              name: z.string().min(1),
              discipline: z.enum(DISCIPLINES),
              /** Rim depth in millimetres. */
              rimDepth: z.number().int().min(10).max(120).nullable(),
              use: localized,
              url: z.url().nullable(),
              verify: z.boolean(),
            })
            .strict(),
        ),
        quotes: z.array(z.object({ rider: z.string().min(1).nullable(), text: localized, verify: z.boolean() }).strict()),
      })
      .strict(),
    setup: z.array(z.object({ category: z.enum(EQUIPMENT_CATEGORIES), partner: z.string().min(1), verify: z.boolean() }).strict()),
  })
  .strict();

export type Localized = z.infer<typeof localized>;
export type Team = z.infer<typeof teamSchema>;
/** site.json plus the founding year, which lives in team.json. */
export type Site = z.infer<typeof siteSchema> & { foundedYear: number };
export type Phase = Site['phase'];
export type CalendarEntry = z.infer<typeof calendarEntrySchema>;
export type Discipline = (typeof DISCIPLINES)[number];
export type Status = (typeof STATUSES)[number];
export type Partner = z.infer<typeof partnerSchema>;
export type Rider = z.infer<typeof riderSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type GalleryItem = z.infer<typeof gallerySchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Category = (typeof CATEGORIES)[number];
export type Result = z.infer<typeof resultSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaFile = Media['files'][number];
export type MediaPhoto = Media['photos'][number];
