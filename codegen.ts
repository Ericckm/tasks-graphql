
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:3000/api/graphql",
  generates: {
    "generated/graphql-backend.ts": {
      plugins: ["typescript", "typescript-resolvers"]
    }
  }
};

export default config;
