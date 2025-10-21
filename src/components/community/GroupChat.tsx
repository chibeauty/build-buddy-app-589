import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, Paperclip, File, Image as ImageIcon, Music, Video, X, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  attachments?: Attachment[];
  reply_to?: string | null;
  replied_message?: {
    id: string;
    message: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
    } | null;
  } | null;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface GroupChatProps {
  groupId: string;
}

export function GroupChat({ groupId }: GroupChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('group-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const fetchMessages = async () => {
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch profiles for unique user IDs
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      
      // Get unique reply_to IDs to fetch replied messages
      const replyToIds = [...new Set(messagesData?.filter(m => m.reply_to).map(m => m.reply_to) || [])];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch replied messages if there are any
      let repliedMessagesMap = new Map();
      if (replyToIds.length > 0) {
        const { data: repliedMessages } = await supabase
          .from('group_messages')
          .select('id, message, user_id')
          .in('id', replyToIds);
        
        if (repliedMessages) {
          repliedMessagesMap = new Map(repliedMessages.map(m => [m.id, m]));
        }
      }

      // Map profiles to messages
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const messagesWithProfiles = messagesData?.map(msg => {
        const repliedMsg = msg.reply_to ? repliedMessagesMap.get(msg.reply_to) : null;
        return {
          ...msg,
          profiles: profilesMap.get(msg.user_id) || null,
          attachments: (msg.attachments as unknown as Attachment[]) || [],
          replied_message: repliedMsg ? {
            ...repliedMsg,
            profiles: profilesMap.get(repliedMsg.user_id) || null,
          } : null,
        };
      }) || [];

      setMessages(messagesWithProfiles);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 20MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<Attachment[]> => {
    if (!user || selectedFiles.length === 0) return [];

    setUploading(true);
    const attachments: Attachment[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('group-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('group-attachments')
          .getPublicUrl(fileName);

        attachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
        });
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }

    return attachments;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;

    setSending(true);
    try {
      const attachments = await uploadFiles();

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          message: newMessage.trim() || 'Sent an attachment',
          attachments: attachments as any,
          reply_to: replyingTo?.id || null,
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold">Group Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.user_id === user?.id ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-medium opacity-70">
                      {message.user_id === user?.id
                        ? 'You'
                        : message.profiles?.full_name || 'Unknown User'}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-60 hover:opacity-100"
                      onClick={() => setReplyingTo(message)}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {message.replied_message && (
                    <div className="mb-2 p-2 rounded bg-background/20 border-l-2 border-current">
                      <p className="text-xs opacity-70 mb-1">
                        Replying to {message.replied_message.user_id === user?.id 
                          ? 'You' 
                          : message.replied_message.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs truncate opacity-80">
                        {message.replied_message.message}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type.startsWith('image/') ? (
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="max-w-xs rounded border cursor-pointer hover:opacity-90"
                              />
                            </a>
                          ) : attachment.type.startsWith('video/') ? (
                            <video 
                              src={attachment.url} 
                              controls 
                              className="max-w-xs rounded border"
                            />
                          ) : attachment.type.startsWith('audio/') ? (
                            <audio src={attachment.url} controls className="w-full max-w-xs" />
                          ) : (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-background/50 rounded border hover:bg-background/80"
                            >
                              {getFileIcon(attachment.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{attachment.name}</p>
                                <p className="text-xs opacity-60">{formatFileSize(attachment.size)}</p>
                              </div>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs mt-1 opacity-60">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/50">
        {replyingTo && (
          <div className="mb-2 p-2 bg-muted rounded-lg flex items-start gap-2">
            <Reply className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">
                Replying to {replyingTo.user_id === user?.id 
                  ? 'yourself' 
                  : replyingTo.profiles?.full_name || 'Unknown User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.message}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 flex-shrink-0"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
              >
                {getFileIcon(file.type)}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <Button
            type="submit"
            size="icon"
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
            className="self-end"
          >
            {sending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line. Max 20MB per file.
        </p>
      </form>
    </div>
  );
}
