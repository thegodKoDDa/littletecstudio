import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { profileSchema } from "@/lib/profile";
import { bridgeRequest } from "@/lib/bridge-transport";

export const runtime = "nodejs";
const requestSchema = z.discriminatedUnion("operation", [
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
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let authorized = false;
  try {
    const host = request.headers.get("host") || "";
    authorized =
      ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(`http://${host}`).hostname,
      ) &&
      (!origin || new URL(origin).host === host) &&
      request.headers.get("sec-fetch-site") !== "cross-site";
  } catch {
    /* Origens e hosts malformados são recusados. */
  }
  if (!authorized)
    return NextResponse.json(
      { error: "Origem não autorizada." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 1_000_000)
      return NextResponse.json(
        { error: "Perfil muito grande." },
        { status: 413 },
      );
    const body = requestSchema.parse(JSON.parse(raw));
    const token = (
      await readFile(
        path.join(process.cwd(), ".runtime", "bridge-token"),
        "utf8",
      )
    ).trim();
    const response = await bridgeRequest(body, token);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Dados inválidos. Confira o perfil ou a ação selecionada." },
        { status: 400 },
      );
    return NextResponse.json(
      {
        error:
          "Ponte local indisponível. Reinicie com npm run dev para iniciar a interface e a ponte juntas. O editor continua disponível.",
      },
      { status: 503 },
    );
  }
}
