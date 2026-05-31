import { diff, diffSchemas, parseSchemaInput, lintSchema, composeFederation } from "../dist/index.js";

const cases = [
  {
    name: "Object type description change",
    fn: () => {
      const o = parseSchemaInput(`type Query { a: String } type User { id: ID }`);
      const n = parseSchemaInput(`"""User type""" type Query { a: String } type User { id: ID }`);
      return diffSchemas(o, n);
    },
  },
  {
    name: "Field description change only",
    fn: () => {
      const o = parseSchemaInput(`type Query { a: String }`);
      const n = parseSchemaInput(`type Query { """desc""" a: String }`);
      return diffSchemas(o, n);
    },
  },
  {
    name: "Enum description change",
    fn: () => {
      const o = parseSchemaInput(`enum Status { ACTIVE }`);
      const n = parseSchemaInput(`"""status""" enum Status { ACTIVE }`);
      return diffSchemas(o, n);
    },
  },
  {
    name: "Union description change",
    fn: () => {
      const o = parseSchemaInput(`type A { x: String } type B { y: String } union U = A | B`);
      const n = parseSchemaInput(`type A { x: String } type B { y: String } """union""" union U = A | B`);
      return diffSchemas(o, n);
    },
  },
  {
    name: "composeFederation invalid SDL",
    fn: () => composeFederation([{ name: "bad", sdl: "type Query { broken" }]),
  },
  {
    name: "composeFederation single subgraph",
    fn: () => composeFederation([{ name: "users", sdl: `extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"]) type Query { u: [User!]! } type User @key(fields: "id") { id: ID! }` }]),
  },
  {
    name: "lintSchema enum missing description",
    fn: () => lintSchema(`enum Status { ACTIVE }`),
  },
  {
    name: "lintSchema bad type name",
    fn: () => lintSchema(`type query { a: String }`),
  },
  {
    name: "lintSchema deprecated field without description",
    fn: () => lintSchema(`type Query { old: String @deprecated(reason: "use new") new: String }`),
  },
  {
    name: "diff type name with numbers",
    fn: () => diff(`type Query { a: String } type Query2 { b: String }`, `type Query { a: String }`),
  },
  {
    name: "parseSchemaInput whitespace-only JSON object",
    fn: () => {
      try { parseSchemaInput("{}"); return "ok"; } catch (e) { return e.message.slice(0, 100); }
    },
  },
];

for (const c of cases) {
  console.log(`\n=== ${c.name} ===`);
  try {
    console.log(JSON.stringify(c.fn(), null, 2));
  } catch (e) {
    console.log("THREW:", e.message);
  }
}
