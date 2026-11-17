import { closePool, migrate } from '@apex/db';

const applied = await migrate();
console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database is up to date.');
await closePool();
