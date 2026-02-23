export type MessageRole = 'user' | 'agent';
export type MessageStreamState = 'in_progress' | 'done' | 'error' | 'cancelled';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  streamState?: MessageStreamState;
  errorInfo?: string;
}
