export interface EmailData {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
}