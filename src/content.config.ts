import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({
    base: "./personal-docs",
    pattern: "**/*.{md,mdx}"
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { docs };
