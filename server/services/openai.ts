import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export async function transcribeAudio(audioBuffer: Buffer): Promise<{ text: string; duration?: number }> {
  try {
    // Create a temporary file from the buffer
    const tempFile = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: tempFile,
      model: "whisper-1",
      response_format: "json",
      language: "en",
    });

    return {
      text: transcription.text,
      duration: (transcription as any).duration || 0,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function generateMemoryPrompt(category?: string): Promise<string> {
  try {
    const categoryContext = category ? `in the ${category} category` : "";
    const prompt = `Generate a thoughtful, personal memory prompt ${categoryContext} that would help someone recall and write about a meaningful experience from their life. The prompt should be engaging, specific enough to spark a memory, but broad enough to be relatable. Return only the prompt text, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates thoughtful prompts to help people remember and write about their personal experiences and memories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || "Tell me about a moment that made you smile today.";
  } catch (error) {
    console.error("Error generating prompt:", error);
    // Return a fallback prompt
    return "Tell me about a moment that made you smile today.";
  }
}

export async function analyzeSentiment(text: string): Promise<{
  emotion: string;
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the emotional tone of the text and classify it into one of these categories: happy, sad, grateful, peaceful, excited, nostalgic, anxious, content, or mixed. Also provide a confidence score between 0 and 1. Respond with JSON in this format: { 'emotion': 'category', 'confidence': number }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      emotion: result.emotion || "content",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      emotion: "content",
      confidence: 0.5,
    };
  }
}

export async function generateSearchEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function semanticSearch(query: string, memories: any[]): Promise<{
  memory: any;
  similarity: number;
  explanation: string;
}[]> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateSearchEmbedding(query);
    
    // Calculate similarity scores for each memory
    const results = await Promise.all(
      memories.map(async (memory) => {
        // Create search text from memory content
        const searchText = [
          memory.content,
          memory.transcript,
          memory.location,
          memory.people?.join(' '),
          memory.emotion,
          memory.prompt
        ].filter(Boolean).join(' ');
        
        // Generate embedding for memory
        const memoryEmbedding = await generateSearchEmbedding(searchText);
        
        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, memoryEmbedding);
        
        return {
          memory,
          similarity,
          explanation: await generateSearchExplanation(query, memory, similarity)
        };
      })
    );
    
    // Sort by similarity score and return top results
    return results
      .filter(result => result.similarity > 0.3) // Only return reasonably similar results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Return top 10 results
      
  } catch (error) {
    console.error("Error in semantic search:", error);
    throw new Error("Failed to perform semantic search: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function generateSearchExplanation(query: string, memory: any, similarity: number): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that explains why a memory matches a search query. Provide a brief, natural explanation of the connection in 1-2 sentences."
        },
        {
          role: "user",
          content: `Search query: "${query}"
          
Memory content: "${memory.content}"
Location: ${memory.location || 'Not specified'}
People: ${memory.people?.join(', ') || 'Not specified'}
Emotion: ${memory.emotion || 'Not specified'}
Similarity score: ${similarity.toFixed(2)}

Explain why this memory matches the search query.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "This memory contains relevant content.";
  } catch (error) {
    console.error("Error generating search explanation:", error);
    return "This memory contains relevant content.";
  }
}

export async function intelligentQueryExpansion(query: string): Promise<{
  expandedQuery: string;
  searchTerms: string[];
  searchStrategy: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a search expert. Analyze the search query and suggest expanded search terms, synonyms, and related concepts that would help find relevant memories. Respond with JSON in this format: { 'expandedQuery': 'string', 'searchTerms': ['term1', 'term2'], 'searchStrategy': 'explanation' }"
        },
        {
          role: "user",
          content: `Expand this search query to find relevant personal memories: "${query}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      expandedQuery: result.expandedQuery || query,
      searchTerms: result.searchTerms || [query],
      searchStrategy: result.searchStrategy || "Direct keyword search"
    };
  } catch (error) {
    console.error("Error in query expansion:", error);
    return {
      expandedQuery: query,
      searchTerms: [query],
      searchStrategy: "Direct keyword search"
    };
  }
}

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
