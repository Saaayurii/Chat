export interface SendEmailData {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendTemplateEmailData {
  to: string[];
  template: string;
  variables: Record<string, any>;
}