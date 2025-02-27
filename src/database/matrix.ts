import Client from "../client";
import { RANGE_STEP, SAMPLE_SIZE, RANGE_START, RANGE_END } from "../constants.ts";

export type InsertRow = {
	v: number;
	a: number;
	d: number;
	i: number;
	emotion?: string | null;
	batch_id?: string | null;
};

export class SelectEmptyItem {
	constructor(
		public v: number,
		public a: number,
		public d: number,
		public i: number
	) {}

	get custom_id() {
		return `${this.v}_${this.a}_${this.d}_${this.i}`;
	}

	get content() {
		return `${this.v} ${this.a} ${this.d}`;
	}
}

export class Matrix {
	static {
		Client.database.prepare(`
			CREATE TABLE IF NOT EXISTS matrix (
				v INTEGER NOT NULL,
				a INTEGER NOT NULL,
				d INTEGER NOT NULL,
				i INTEGER NOT NULL,
				emotion TEXT,
				batch_id TEXT,
				FOREIGN KEY (batch_id) REFERENCES batch(id),
				PRIMARY KEY (v, a, d, i)
			);
		`).run();
	}

	public static create() {
		const dimension_range: number[] = [];

		for (let i = RANGE_START; i <= RANGE_END; i += RANGE_STEP) {
			dimension_range.push(i);
		}

		Client.database.transaction(() => {
			for (const v of dimension_range) {
				for (const a of dimension_range) {
					for (const d of dimension_range) {
						for (let i = 0; i < SAMPLE_SIZE; ++i) {
							Matrix.insertOne({ v, a, d, i });
						}
					}
				}
			}
		})();
	}

	private static insert_one_statement = Client.database.prepare(`INSERT OR IGNORE INTO matrix (v, a, d, i, emotion, batch_id) VALUES ($v, $a, $d, $i, $emotion, $batch_id);`);

	public static insertOne(row: InsertRow) {
		Matrix.insert_one_statement.run({
			$v: row.v,
			$a: row.a,
			$d: row.d,
			$i: row.i,
			$emotion: row.emotion ?? null,
			$batch_id: row.batch_id ?? null,
		});
	}

	private static select_empty_items_statement = Client.database.prepare(`
        SELECT v, a, d, i FROM matrix 
        WHERE emotion IS NULL AND batch_id IS NULL 
        LIMIT 25; 
	`).as(SelectEmptyItem);

	public static selectEmptyItems() {
		return Matrix.select_empty_items_statement.all();
	}

	private static set_batch_id_statement = Client.database.prepare(`
		UPDATE matrix 
		SET batch_id = $id 
		WHERE v = $v AND a = $a AND d = $d AND i = $i;
	`);

	public static setBatchId(id: string, data: SelectEmptyItem) {
		Matrix.set_batch_id_statement.run({
			$id: id,
			$v: data.v,
			$a: data.a,
			$d: data.d,
			$i: data.i,
		});
	}

	public static nullBatchId(data: SelectEmptyItem) {
		Matrix.set_batch_id_statement.run({
			$id: null,
			$v: data.v,
			$a: data.a,
			$d: data.d,
			$i: data.i,
		});
	}

	public static setBatchIds(id: string, items: SelectEmptyItem[]) {
		Client.database.transaction(() => {
			for (const item of items) {
				Matrix.setBatchId(id, item);
			}
		})();
	}

	private static count_empty_statement = Client.database.prepare(`
		SELECT COUNT(*) FROM matrix WHERE batch_id IS NOT NULL;
	`);

	public static countEmpty() {
		return Matrix.count_empty_statement.get() as number;
	}

	private static set_emotion_statement = Client.database.prepare(`
		UPDATE matrix 
		SET emotion = $emotion
		WHERE v = $v AND a = $a AND d = $d AND i = $i;
	`);

	public static setEmotion(data: SelectEmptyItem, emotion: string) {
		return Matrix.set_emotion_statement.run({
			$emotion: emotion,
			$v: data.v,
			$a: data.a,
			$d: data.d,
			$i: data.i,
		});
	}
}
