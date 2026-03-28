import { promises as fs } from "node:fs"
import path from "node:path"

import type { PlatformStore } from "@/lib/platform/types"

const storePath = path.join(process.cwd(), "data", "platform-store.json")

export async function readPlatformStore() {
  const raw = await fs.readFile(storePath, "utf-8")
  return JSON.parse(raw) as PlatformStore
}

export async function writePlatformStore(store: PlatformStore) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2))
}
