import { createAzure } from '@ai-sdk/azure';
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { streamText, type CoreMessage } from 'ai';
import { cors } from 'hono/cors';
import 'dotenv/config'
import { possibleTools } from './tools.js';

const app = new Hono()
const azure = createAzure({
  resourceName: process.env.AI_RESOURCE, // Azure resource name
  apiKey: process.env.AI_API_KEY, // Azure API key
});


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.use('/api/*', cors())

app.post('/api/chat',async (context) => {
  const { messages } = await context.req.json<{messages: CoreMessage[]}>()
  const result = await streamText({
    model: azure('gpt-4o-mini'),
    messages,
    tools: possibleTools,
    maxSteps: 30,
  });

  return result.toDataStreamResponse();
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
