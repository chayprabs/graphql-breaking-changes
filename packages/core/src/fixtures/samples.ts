export const SAMPLE_OLD_SDL = `type Query {
  hello: String
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  email: String
}`;

export const SAMPLE_NEW_SDL = `type Query {
  hello: String
  user(id: ID!): User
}

type User {
  id: ID!
  fullName: String!
}`;

export const SAMPLE_OPERATION = `query GetUser {
  user(id: "1") {
    id
    name
    email
  }
}`;

export const FEDERATION_SUBGRAPHS = {
  users: `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

type Query {
  users: [User!]!
}

type User @key(fields: "id") {
  id: ID!
  name: String!
}`,

  products: `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

type Query {
  products: [Product!]!
}

type Product @key(fields: "id") {
  id: ID!
  name: String!
  price: Float!
}`,
};

export const FEDERATION_BROKEN_SUBGRAPH = `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

type Query {
  users: [User!]!
}

type User @key(fields: "id") {
  id: ID!
  name: String!
  # Missing required federation field resolver hints - invalid @key
}`;
