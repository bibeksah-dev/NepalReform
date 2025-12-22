import { createClient } from "@/lib/supabase/server"

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validates if a string is in manifesto format (manifesto-{number})
 */
export function isManifestoFormat(id: string): boolean {
  return /^manifesto-\d+$/.test(id)
}

/**
 * Validates if a string is a raw integer
 */
export function isRawInteger(id: string): boolean {
  return /^\d+$/.test(id)
}

/**
 * Converts raw integer ID to manifesto format
 */
export function toManifestoFormat(id: string): string {
  if (isRawInteger(id)) {
    return `manifesto-${id}`
  }
  return id
}

/**
 * Fetches or creates agenda UUID based on manifesto ID
 * This ensures consistent UUID mapping for agenda items
 */
export async function getOrCreateAgendaUUID(manifestoId: string): Promise<string | null> {
  const supabase = await createClient()

  try {
    // First, try to find existing agenda by sequence_id column (manifesto number)
    const manifestoNumber = manifestoId.replace("manifesto-", "")

    const { data: existingAgenda, error: fetchError } = await supabase
      .from("agendas")
      .select("id")
      .eq("sequence_id", Number.parseInt(manifestoNumber))
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[v0] Error fetching agenda:", fetchError)
      throw fetchError
    }

    if (existingAgenda) {
      console.log("[v0] Found existing agenda UUID:", existingAgenda.id, "for manifesto:", manifestoId)
      return existingAgenda.id
    }

    // If no existing agenda found, create a deterministic UUID
    // This ensures the same manifesto ID always gets the same UUID
    const deterministicUUID = generateDeterministicUUID(manifestoId)
    console.log("[v0] Generated deterministic UUID:", deterministicUUID, "for manifesto:", manifestoId)

    return deterministicUUID
  } catch (error) {
    console.error("[v0] Error in getOrCreateAgendaUUID:", error)
    return null
  }
}

/**
 * Generates a deterministic UUID based on manifesto ID
 * This ensures consistent UUIDs for the same manifesto items across sessions
 */
function generateDeterministicUUID(manifestoId: string): string {
  // Create a simple hash from the manifesto ID
  const seedString = `agenda-${manifestoId}`
  let hash = 0

  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to positive number and create UUID-like string
  const positiveHash = Math.abs(hash)
  const hex = positiveHash.toString(16).padStart(8, "0")

  // Extract manifesto number for consistent formatting
  const manifestoNumber = manifestoId.replace("manifesto-", "").padStart(4, "0")

  // Create a valid UUID v4 format with deterministic components
  return `${hex.substring(0, 8)}-${manifestoNumber}-4000-8${hex.substring(8, 11) || "000"}-${hex.substring(0, 12).padEnd(12, "0")}`
}

/**
 * Validates and normalizes agenda ID for API operations
 */
export async function validateAndNormalizeAgendaId(id: string): Promise<{
  isValid: boolean
  normalizedId: string
  agendaUUID: string | null
  error?: string
}> {
  try {
    let normalizedId = id
    let agendaUUID: string | null = null

    // Handle different ID formats
    if (isValidUUID(id)) {
      // Already a UUID, use as-is
      normalizedId = id
      agendaUUID = id
    } else if (isRawInteger(id)) {
      // Convert raw integer to manifesto format
      normalizedId = toManifestoFormat(id)
      agendaUUID = await getOrCreateAgendaUUID(normalizedId)
    } else if (isManifestoFormat(id)) {
      // Already in manifesto format
      normalizedId = id
      agendaUUID = await getOrCreateAgendaUUID(id)
    } else {
      return {
        isValid: false,
        normalizedId: id,
        agendaUUID: null,
        error: "Invalid ID format. Expected UUID, integer, or manifesto-{number} format.",
      }
    }

    return {
      isValid: true,
      normalizedId,
      agendaUUID,
    }
  } catch (error) {
    console.error("[v0] Error validating agenda ID:", error)
    return {
      isValid: false,
      normalizedId: id,
      agendaUUID: null,
      error: "Failed to validate agenda ID",
    }
  }
}

/**
 * Validates suggestion UUID and ensures it exists in the database
 */
export async function validateSuggestionUUID(suggestionId: string): Promise<{
  isValid: boolean
  exists: boolean
  error?: string
}> {
  if (!isValidUUID(suggestionId)) {
    return {
      isValid: false,
      exists: false,
      error: "Invalid UUID format",
    }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("suggestions").select("id").eq("id", suggestionId).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return {
      isValid: true,
      exists: !!data,
      error: data ? undefined : "Suggestion not found",
    }
  } catch (error) {
    console.error("[v0] Error validating suggestion UUID:", error)
    return {
      isValid: true,
      exists: false,
      error: "Failed to validate suggestion",
    }
  }
}
