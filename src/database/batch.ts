import Client from "../client";

export class Batch {
	static {
		Client.database.prepare(`
			CREATE TABLE IF NOT EXISTS batch (
				id TEXT PRIMARY KEY
			);
		`).run();
	}

	public static create() {}

	private static insert_statement = Client.database.prepare(`
		INSERT INTO batch (id) VALUES ($id);
	`);

	public static insert(id: string) {
		return Batch.insert_statement.run({ $id: id });
	}

	public static select_all_statement = Client.database.prepare(`
		SELECT id FROM batch;
	`);

	public static selectAll() {
		return Batch.select_all_statement.all() as { id: string }[];
	}

	private static delete_statement = Client.database.prepare(`
		DELETE FROM batch WHERE id = $id;
	`);

	public static delete(id: string) {
		return Batch.delete_statement.run({ $id: id });
	}
}
