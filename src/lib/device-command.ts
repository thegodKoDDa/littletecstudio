import { z } from "zod";
import { profileSchema } from "./profile";

export const deviceCommandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("status") }),
  z.object({ operation: z.literal("read") }),
  z.object({ operation: z.literal("diagnose") }),
  z.object({
    operation: z.literal("live_start"),
    client: z.string().min(1).max(80),
  }),
  z.object({
    operation: z.literal("live_stop"),
    client: z.string().min(1).max(80),
  }),
  z.object({
    operation: z.literal("live_events"),
    client: z.string().min(1).max(80),
    cursor: z.number().int().min(0),
  }),
  z.object({
    operation: z.literal("backup_export"),
    revision: z.string().min(1),
  }),
  z.object({
    operation: z.literal("backup_import"),
    backup: z.object({
      format: z.literal("littletec-backup"),
      manifest: z.record(z.string(), z.unknown()),
      files: z.object({
        "layer-1.bin": z.string().regex(/^[a-fA-F0-9]{3120}$/),
        "layer-2.bin": z.string().regex(/^[a-fA-F0-9]{3120}$/),
        "layer-3.bin": z.string().regex(/^[a-fA-F0-9]{3120}$/),
      }),
    }),
  }),
  z.object({
    operation: z.literal("apply"),
    profile: profileSchema,
    revision: z.string().min(1),
  }),
  z.object({
    operation: z.literal("led"),
    mode: z.number().int().min(0).max(5),
    color: z.string(),
    layer: z.number().int().min(1).max(3),
    revision: z.string().min(1),
  }),
  z.object({
    operation: z.literal("led_all"),
    mode: z.number().int().min(0).max(5),
    color: z.string(),
    revision: z.string().min(1),
  }),
]);
