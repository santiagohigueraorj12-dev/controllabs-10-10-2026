import { defineConfig } from 'prisma/config';
import { createDatabaseUrl } from './src/db/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: createDatabaseUrl()
  }
});
