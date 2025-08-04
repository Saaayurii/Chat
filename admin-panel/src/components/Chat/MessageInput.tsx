"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X } from "lucide-react";
import Button from "@/components/UI/Button";

interface FilePreview {
  file: File;
  id: string;
}

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  isMobile?: boolean;
}

function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Введите сообщение...",
  isMobile = false,
}: MessageInputProps) {
  const { 0: message, 1: setMessage } = useState("");
  const { 0: filePreview, 1: setFilePreview } = useState<FilePreview | null>(
    null
  );
  const { 0: sending, 1: setSending } = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const preview: FilePreview = {
          file,
          id: Math.random().toString(36).substr(2, 9),
        };
        setFilePreview(preview);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleRemoveFile = useCallback(() => {
    setFilePreview(null);
  }, []);

  const handleSend = useCallback(async () => {
    if ((!message.trim() && !filePreview) || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim(), filePreview?.file);
      setMessage("");
      setFilePreview(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  }, [message, filePreview, sending, disabled, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  return (
    <div
      className={`border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 ${
        isMobile ? "fixed bottom-0 left-0 right-0 z-50" : "relative"
      }`}
    >
      {/* File preview */}
      {filePreview && (
        <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(filePreview.file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        {/* File upload button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="flex-shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              minHeight: "40px",
              maxHeight: "120px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !filePreview) || sending || disabled}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
