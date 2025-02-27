import Database from "./database";
import Job from "./job";

Database.Matrix.create();
Database.Batch.create();

await Promise.all([
	Job.generate(),
	Job.process(),
]);
