export type MessageRole = 'user' | 'agent';
export type MessageStreamState = 'in_progress' | 'done' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  streamState?: MessageStreamState;
  errorInfo?: string;
}
