import { parse } from "graphql";
import { composeServices } from "@theguild/federation-composition";
import type { CompositionResult, SubgraphInput } from "./types.js";

export function composeFederation(subgraphs: SubgraphInput[]): CompositionResult {
  if (subgraphs.length === 0) {
    return { success: false, errors: [{ message: "At least one subgraph is required." }] };
  }

  try {
    const services = subgraphs.map((sg) => ({
      name: sg.name,
      typeDefs: parse(sg.sdl),
    }));

    const result = composeServices(services);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        errors: result.errors.map((e) => ({
          message: e.message,
          source: e.source ?? undefined,
        })),
      };
    }

    const supergraphSdl =
      typeof result.supergraphSdl === "string" ? result.supergraphSdl : undefined;

    return {
      success: true,
      supergraphSdl,
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      errors: [{ message: err instanceof Error ? err.message : String(err) }],
    };
  }
}
