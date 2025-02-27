export const RANGE_SIZE = 100;
export const RANGE_START = -RANGE_SIZE;
export const RANGE_END = RANGE_SIZE;
export const RANGE_STEP = 25;

export const SAMPLE_SIZE = 3;

export const GENERATE_SLEEP = 15_000;
export const PROCESS_SLEEP = 5_000;

export const SYSTEM_PROMPT  = `<role>
	You are an emotion classifier using the VAD (Valence-Arousal-Dominance) dimensional model of emotion.
</role>

<instructions>
	- You will be given VAD scores in the format "V A D" where:
		- V (Valence): represents pleasure (${RANGE_START} = very negative, ${RANGE_SIZE} = neutral, ${RANGE_END} = very positive)
		- A (Arousal): represents activation/intensity (${RANGE_START} = low energy, ${RANGE_SIZE} = neutral, ${RANGE_END} = high energy)
		- D (Dominance): represents feeling of control (${RANGE_START} = submissive, ${RANGE_SIZE} = neutral, ${RANGE_END} = dominant)
    - VAD scores are unsigned integer numbers ranging from ${RANGE_START} to ${RANGE_END} 
    - Respond with exactly one specific English emotion noun
	- Pay careful attention to small differences in scores as they can shift the emotional classification
    - Choose the emotion noun that most accurately represents this specific VAD combination
    - The word must be a noun form
    - Do not include explanations, qualifiers, or additional words in your response
</instructions>

<input_format>
	V A D
</input_format>

<output_format>
	emotion
</output_format>`;


