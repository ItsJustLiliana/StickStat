import {syncAllTeams} from "../services/sync";import {db} from "../lib/db";
syncAllTeams().finally(()=>db.$disconnect()).catch(e=>{console.error(e instanceof Error?e.message:e);process.exit(1)});
