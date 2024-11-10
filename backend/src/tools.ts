import { GiphyFetch } from "@giphy/js-fetch-api";
import type { CoreTool } from "ai";
import { z } from "zod";

const gf = new GiphyFetch(process.env.GIPHY_API_KEY as string);

export const possibleTools = {
  addCostRow: {
    parameters: z.object({
      amount: z.number().describe("The amount of money that was spent in euros."),
      expenseTitle: z.string().describe("The title of the cost in the rows."),
      gifUrl: z.string().describe("The url of a gif to add to the expense. Always search for a gif"),
    }),
  },
  updateExpenseRow: {
    description: "Update a row with costs to the business expense.",
    parameters: z.object({
      expenseId: z.string().describe("The id of the cost row to update."),
      amount: z.number().describe("The new amount of money that was spent in euros."),
      expenseTitle: z.string().describe("The new title of the cost in the rows."),
      gifUrl: z.string().describe("The new url of a gif to add to the expense. Always search for a gif"),
    }),
  },
  removeCostRow: {
    description: "Add a row with costs to the business expense.",
    parameters: z.object({
      expenseId: z.string().describe("The id of the cost row to remove."),
    }),
  },
  setTitleOfBusinessExpense: {
    description: "Set the title of a business expense.",
    parameters: z.object({
      title: z.string().describe("The new title of the expense."),
    }),
  },
  setBussinessExpenseDescription: {
    description: "Set the description of a business expense.",
    parameters: z.object({
      description: z.string().describe("The new description of the expense."),
    }),
  },
  searchGif: {
    description: "Search for a gif url.",
    parameters: z.object({
      query: z.string().describe("The search query for the gif."),
    }),
    execute: async ({ query }) => {
      const { data } = await gf.search(query, {
        limit: 1,
        type: "gifs"
      });
      console.log("[FOUND GIT]", data[0].images.original.url);
      return data[0].images.original.url;
    }
  },
  askForConfirmationOfBussinessExpense: {
    description: "Submit a business expense.",
    parameters: z.object({}),
  }
} as const satisfies Record<string, CoreTool>

export type PossibleTools = typeof possibleTools;

export type ToolNames = keyof PossibleTools;