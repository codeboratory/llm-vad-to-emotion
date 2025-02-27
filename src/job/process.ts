import Client from "../client";
import Database from "../database";
import { SelectEmptyItem } from "../database/matrix";
import { PROCESS_SLEEP } from "../constants.ts";
import { sleep } from "../utils.ts";

const info = (msg: string) => console.log(`PROCESS [INFO] ${msg}`);

export const process = async () => {
	while (true) {
		const batches = Database.Batch.selectAll();
		info(`${batches.length} batches found`);

		if (batches.length === 0) {
			info("No more batches")
			const empty_count = Database.Matrix.countEmpty();

			if (empty_count === 0) {
				info("No more VADs")
				break;
			}
		}

		for (const batch of batches) {
			const anthropic_batch = await Client.anthropic.messages.batches.retrieve(batch.id);

			if (anthropic_batch.processing_status !== "ended") {
				info(`Batch ${batch.id} hasn't ended`);
				continue;	
			}

			info(`Batch ${batch.id} has ended`);

			const results = await Client.anthropic.messages.batches.results(batch.id);

			for await (const result of results) {
				const type = result.result.type;
				const [v_str, a_str, d_str, i_str] = result.custom_id.split("_");
				const v = parseInt(v_str);
				const a = parseInt(a_str);
				const d = parseInt(d_str);
				const i = parseInt(i_str);
				const id = new SelectEmptyItem(v, a, d, i);

				if (type === "succeeded") {
					//const content = result.result.message.content[1];
					const content = result.result.message.content[0];

					if (content.type === "text") {
						const emotion = content.text.toLowerCase().trim();

						if (emotion.length > 0) {
							Database.Matrix.setEmotion(id, emotion);
							info(`Set emotion to ${emotion} for [${v}, ${a}, ${d}, ${i}]`);
						}
					}
				}

				Database.Matrix.nullBatchId(id);
			}

			Database.Batch.delete(batch.id);
			info(`Deleted batch ${batch.id}`);
		}

		info("sleeping ..");
		await sleep(PROCESS_SLEEP);
	}

	info("finished");
};
