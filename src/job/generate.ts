import Client from "../client";
import Database from "../database";
import { SYSTEM_PROMPT, GENERATE_SLEEP } from "../constants.ts";
import { sleep } from "../utils.ts";

const info = (msg: string) => console.log(`GENERATE [INFO] ${msg}`);

export const generate = async () => {
	while (true) {
		const items = Database.Matrix.selectEmptyItems();	

		if (items.length === 0) {
			info("No more VADs");
			break;
		}

		const requests: any[] = [];
		
		for (const item of items) {
			requests.push({
			  custom_id: item.custom_id,
			  params: {
				model: 'claude-3-7-sonnet-20250219',
				max_tokens: 2048,
				//thinking: {
				//	type: "enabled",
				//	budget_tokens: 1024, 
				//},
				system: [{
					type: "text",
					text: SYSTEM_PROMPT,
				}],
				messages: [{
					role: 'user',
					content: item.content,
				}],
			  },
			});	
		}

		const anthropic_batch = await Client.anthropic.beta.messages.batches.create({
			requests,
		});

		const id = anthropic_batch.id;

		info(`Created batch ${id}`);

		Database.Batch.insert(id);
		Database.Matrix.setBatchIds(id, items);

		info("sleep ..");
		await sleep(GENERATE_SLEEP);
	}

	info("Finished");
};
