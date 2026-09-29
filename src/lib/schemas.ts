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

export const PHASES = ['preseason', 'racing', 'offseason'] as const;

export const siteSchema = z.object({
  currentSeason: seasonYear,
  foundedYear: seasonYear,
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
});

export const DISCIPLINES = ['ROAD', 'TRACK', 'CX', 'TTT', 'MTB'] as const;
export const STATUSES = ['confirmed', 'tbc', 'cancelled'] as const;

export const calendarEntrySchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'may only use lowercase letters, digits and dashes')
      .optional(),
    start: isoDate.optional(),
    end: isoDate.optional(),
    month: z.number().int().min(1).max(12).optional(),
    name: z.string().min(1),
    name_en: z.string().min(1).optional(),
    location: z.string().min(1).nullable(),
    location_en: z.string().min(1).optional(),
    country: countryCode,
    discipline: z.enum(DISCIPLINES),
    class: z.string().min(1).nullable(),
    status: z.enum(STATUSES),
    type: z.enum(['race', 'training']).optional(),
    result: z.string().min(1).optional(),
    url: z.url().optional(),
    verify: z.boolean().optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
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
    description: localized.optional(),
    seasons,
  })
  .strict();

export const riderSchema = z
  .object({
    name: z.string().min(1),
    nat: countryCode,
    squad: z.enum(['continental', 'junior']),
    instagram: z
      .string()
      .regex(/^[A-Za-z0-9._]+$/, 'is the Instagram handle only, without @ or https://')
      .nullable()
      .optional(),
    photo: z.string().min(1),
    role: localized.optional(),
    seasons,
    new: z.boolean().optional(),
  })
  .strict();

export const staffSchema = z
  .object({
    name: z.string().min(1),
    role: localized,
    photo: z.string().min(1),
    instagram: z.string().regex(/^[A-Za-z0-9._]+$/).nullable().optional(),
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
    photo: z.string().min(1),
    aspect: z.enum(['3:4', '4:3', '16:9']),
    feature: z.boolean().optional(),
    alt: localized,
    race: localized,
    place: localized,
    credit: z.string().min(1),
  })
  .strict();

export type Localized = z.infer<typeof localized>;
export type Site = z.infer<typeof siteSchema>;
export type Phase = Site['phase'];
export type CalendarEntry = z.infer<typeof calendarEntrySchema>;
export type Discipline = (typeof DISCIPLINES)[number];
export type Status = (typeof STATUSES)[number];
export type Partner = z.infer<typeof partnerSchema>;
export type Rider = z.infer<typeof riderSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type GalleryItem = z.infer<typeof gallerySchema>;
