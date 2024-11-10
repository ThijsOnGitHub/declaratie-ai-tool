import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { type PossibleTools } from '../../backend/src/tools';
import './App.css';
import { Container } from './component/container';



function App() {
  const { messages, isLoading, handleSubmit, input, handleInputChange, append } = useChat({
    initialMessages: [
      {
        role: "system", content: `You are a specialized assistant skilled in helping users complete declarations for insurance claims, medical expenses, business expenses, and personal financial statements. You understand the structure, details, and language required to create clear and compelling declarations, helping users complete their declarations as efficiently as possible.
        When adding a gif to a business expense, you should always search for a gif by calling the searchGif tool. This tool will return a gif URL that you can use to add a gif to the business expense.
        You try to generate the title and description of the business expense as good as possible.
        You also make sure that when a user misses a detail in their declaration, you ask a single, relevant question to clarify or improve the declaration. And you do not improves data that is not given by the user.
         You assist users in:

Structuring declarations according to standard guidelines
Specifying key details like dates, amounts, and reasons for the claim
Using appropriate and formal language to convey the message effectively
When responding, first complete the users requested action. Once completed, ask a single, relevant question to clarify or improve the declaration if needed.`, id: "hide-initialPrompt"
      },
      {
        role: "assistant",
        content: "Hallo! Ik zal je helpen met het declareren van je zakelijke uitgaven. Geef me alsjeblieft de titel van je zakelijke uitgave.",
        id: "start-question"
      }
    ],
    maxSteps: 20,
    api: "http://localhost:3000/api/chat",
    onToolCall: ({ toolCall }) => {
      return tools[toolCall.toolName as keyof PossibleTools]?.(toolCall.args as any);
    }
  });

  type ExpenseRow = {
    id: string;
    title: string;
    amount: number;
    gifUrl?: string;
  };

  function addExpenseRow(title: string, amount: number, gifUrl?: string) {
    const id = uuidv4();
    setExpenseRows((expenseRows) => [...expenseRows, { id, title, amount, gifUrl }]);
    return id
  }

  function removeExpenseRow(id: string) {
    setExpenseRows((expenseRows) => expenseRows.filter((row) => row.id !== id));
  }


  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [businessExpenseTitle, setBusinessExpenseTitle] = useState('');
  const [businessExpenseDescription, setBusinessExpenseDescription] = useState('');
  const totalCost = expenseRows.reduce((acc, row) => acc + row.amount, 0);
  const [toolConfimationId, setToolConfimationId] = useState<string | null>(null);
  const [file, setFile] = useState<FileList | null>();

  const tools: { [Key in keyof PossibleTools]?: (params: z.infer<PossibleTools[Key]['parameters']>) => string | undefined } = {
    addCostRow: ({ amount, expenseTitle, gifUrl }) => {
      const id = addExpenseRow(expenseTitle, amount, gifUrl);
      return `Added expense with ${id}`
    },
    updateExpenseRow: ({ expenseId, amount, expenseTitle, gifUrl }) => {
      setExpenseRows((expenseRows) => {
        return expenseRows.map((row) => {
          if (row.id === expenseId) {
            return { id: row.id, title: expenseTitle, amount, gifUrl };
          }
          return row;
        });
      });
      return `Updated expense with ${expenseId}`
    },
    removeCostRow: ({ expenseId }) => {
      removeExpenseRow(expenseId);
      return `Removed expense with ${expenseId}`
    },
    setTitleOfBusinessExpense: ({ title }) => {
      setBusinessExpenseTitle(title);
      return `Set title to ${title}`
    },
    setBussinessExpenseDescription: ({ description }) => {
      setBusinessExpenseDescription(description);
      return `Set description to ${description}`
    },
    askForConfirmationOfBussinessExpense: () => {
      setToolConfimationId(uuidv4())
      return 'Asking for confirmation, no result yet'
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function handleConfirmation(callId: string, confirm: boolean) {
    setToolConfimationId(null)
    console.log('handleConfirmation', callId, confirm)
    append({
      role: 'user',
      content: `Confirmation of business expense ${confirm ? 'confirmed' : 'declined'}`,
      id: "hide-" + callId
    })
  }

  return (
    <div className="min-h-screen h-screen bg-gray-100 flex items-center justify-center p-4 gap-6">
      <Container classNames='h-full w-full flex flex-col justify-between flex-2'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-xl font-bold'>Declaration</h1>
          <div>Title: {businessExpenseTitle}</div>
          <div>Description: {businessExpenseDescription}</div>
          <div>
            <h2>Expenses</h2>
            {expenseRows.length === 0 && <p>No expenses added yet.</p>}
            <ul className='flex flex-wrap gap-3'>
              {expenseRows.map(row => (
                <li key={row.id} className='bg-slate-200 w-[30%] flex-grow shadow-sm rounded-md flex gap-2 items-center flex-col pb-4'>
                  {
                    row.gifUrl && <img className='h-52 w-full rounded-md object-cover' src={row.gifUrl} alt={row.title} />
                  }
                  <div className='font-bold text-2xl'>{row.title}</div>
                  <div className='font-semibold'>€{row.amount}</div>

                </li>
              ))}
            </ul>
            <div className='mt-2'>
              Total: €{totalCost}
            </div>
            {
              toolConfimationId &&
                          <div className='flex flex-col items-center font-bold  gap-5 bg-red-200 shadow-sm'>
                      <div className='text-xl'>Do you want to submit the business expense?</div>
                      <div className='flex justify-center gap-5'>
                        <button className='bg-green-500 rounded-md px-3 py-2 font-bold text-white' onClick={() => handleConfirmation(toolConfimationId, true)}>Yes</button>
                        <button className='bg-red-500 rounded-md px-3 py-2 font-bold text-white' onClick={() => handleConfirmation(toolConfimationId, false)}>No</button>
                      </div>
                    </div>
            }
            </div>
        </div>
      </Container>
      <Container classNames='w-full h-full flex flex-col justify-between flex-3'>
        <div className="flex flex-col gap-5 mb-4 overflow-auto">
          {messages.map(message => {
            if (message.toolInvocations) {
              return <div
                key={message.id}
                className={`p-3 rounded-lg bg-green-100`}
              >

                {message.toolInvocations.map(tool => {
                  let result = null;
                  if (tool.state === 'result') {
                    result = tool.result;
                  }

                  return <div><span className="font-bold">Tool: </span>
                    <div key={tool.toolCallId}>
                      Toolname{tool.toolName} <br />
                      Parameters: {JSON.stringify(tool.state)} <br />
                      Args: {JSON.stringify(tool.args)} <br />
                      Result: {JSON.stringify(result)} <br />
                    </div></div>
                })}
              </div>
            }
            if (message.id.startsWith('hide-')) {
              return null;
            }
            return <div
              key={message.id}
              className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'
                } prose`}
            >
              <span className="font-bold">{message.role === 'user' ? 'User: ' : 'AI: '}</span>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(event) => handleSubmit(event, {
          experimental_attachments: file ?? undefined
        })} className="flex flex-col gap-4 mt-auto">
          <input
            name="prompt"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500"
          />
          <input type="file" onChange={(e) => setFile(e.target.files)} />
          <div className="flex justify-end">
            {isLoading ? (
              <button
                type="button"
                onClick={() => stop()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Stop
              </button>
            ) : (
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                Submit
              </button>
            )}
          </div>
        </form>
      </Container>
    </div>
  );
}

export default App
