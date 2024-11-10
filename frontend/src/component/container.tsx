import { cn } from "../utils/cn";

export function Container({ children, classNames }: { children: React.ReactNode, classNames? : string}) {
  return <div className={cn("bg-white rounded-lg shadow-md p-6",classNames)}>{children}</div>
}