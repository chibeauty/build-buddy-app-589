import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, Paperclip, File, Image as ImageIcon, Music, Video, X, Reply, Smile, Mic, Languages } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MediaRecorderComponent } from './MediaRecorder';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface GroupMember {
  id: string;
  user_id: string;
  full_name: string;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  mentions?: string[];
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
  translatedText?: string;
  showTranslation?: boolean;
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
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [userLanguage, setUserLanguage] = useState<string>('English');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchMessages();
    fetchGroupMembers();

    // Set up real-time subscription for messages
    const messagesChannel = supabase
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

    // Set up presence channel for typing indicators
    const presenceChannel = supabase
      .channel(`group-typing:${groupId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = new Map<string, string>();
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence.user_id !== user.id && presence.is_typing) {
            typing.set(presence.user_id, presence.full_name);
          }
        });
        
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [groupId, user]);

  const fetchGroupMembers = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setGroupMembers([]);
        return;
      }

      // Fetch profiles separately
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to members
      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      const members = membersData.map(member => ({
        id: member.id,
        user_id: member.user_id,
        full_name: profilesMap.get(member.user_id) || 'Unknown User',
      }));

      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch reactions for all messages
      const messageIds = messagesData?.map(m => m.id) || [];
      const { data: reactionsData } = await supabase
        .from('group_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);

      // Process reactions by message
      const reactionsByMessage = new Map<string, Reaction[]>();
      reactionsData?.forEach(reaction => {
        const existing = reactionsByMessage.get(reaction.message_id) || [];
        const emojiReaction = existing.find(r => r.emoji === reaction.emoji);
        
        if (emojiReaction) {
          emojiReaction.count++;
          emojiReaction.users.push(reaction.user_id);
          if (reaction.user_id === user?.id) {
            emojiReaction.hasReacted = true;
          }
        } else {
          existing.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user_id],
            hasReacted: reaction.user_id === user?.id,
          });
        }
        
        reactionsByMessage.set(reaction.message_id, existing);
      });

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
          reactions: reactionsByMessage.get(msg.id) || [],
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

  const handleMediaRecording = async (blob: Blob, type: 'audio' | 'video') => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = type === 'audio' ? 'webm' : 'webm';
      const fileName = `${user.id}/${Date.now()}-${type}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('group-attachments')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-attachments')
        .getPublicUrl(fileName);

      const attachment: Attachment = {
        name: `${type}-message.${fileExt}`,
        url: publicUrl,
        type: type === 'audio' ? 'audio/webm' : 'video/webm',
        size: blob.size,
      };

      // Send message with media attachment
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          message: type === 'audio' ? '🎤 Voice message' : '🎥 Video message',
          attachments: [attachment] as any,
        });

      if (error) throw error;

      setShowMediaRecorder(false);
      toast({
        title: 'Success',
        description: `${type === 'audio' ? 'Voice note' : 'Video message'} sent`,
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload media',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
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
          mentions: selectedMentions.length > 0 ? selectedMentions : null,
        });

      if (error) throw error;

      // Clear typing status
      const channel = supabase.channel(`group-typing:${groupId}`);
      await channel.track({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || 'Someone',
        is_typing: false,
      });

      setNewMessage('');
      setSelectedFiles([]);
      setReplyingTo(null);
      setSelectedMentions([]);
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

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(r => r.emoji === emoji && r.hasReacted);

      if (existingReaction) {
        // Remove reaction if clicking the same emoji
        const { error } = await supabase
          .from('group_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);

        if (error) throw error;
      } else {
        // First, remove any existing reaction from this user on this message
        await supabase
          .from('group_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        // Then add the new reaction
        const { error } = await supabase
          .from('group_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji,
          });

        if (error) throw error;
      }

      // Refresh messages to show updated reactions
      await fetchMessages();
      setShowEmojiPicker(null);
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      });
    }
  };

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi',
    'Dutch', 'Swedish', 'Polish', 'Turkish', 'Vietnamese', 'Thai'
  ];

  const handleTranslateMessage = async (messageId: string, messageText: string) => {
    if (translatingMessageId === messageId) return;

    setTranslatingMessageId(messageId);
    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { 
          text: messageText,
          targetLanguage: userLanguage
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || 'Failed to connect to translation service');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.translatedText) {
        throw new Error('No translation returned');
      }

      // Update message with translation
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, translatedText: data.translatedText, showTranslation: true }
          : msg
      ));

      toast({
        title: 'Translated',
        description: `Translated to ${userLanguage}`,
      });

    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: error.message || 'Could not translate message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTranslatingMessageId(null);
    }
  };

  const toggleTranslation = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showTranslation: !msg.showTranslation }
        : msg
    ));
  };

  const handleMessageInput = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewMessage(text);

    // Broadcast typing status
    if (text.trim() && user) {
      const channel = supabase.channel(`group-typing:${groupId}`);
      await channel.track({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || 'Someone',
        is_typing: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to clear typing status after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        await channel.track({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || 'Someone',
          is_typing: false,
        });
      }, 3000);
    }

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtPos + 1);
      // Only show mentions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionStartPos(lastAtPos);
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const handleMentionSelect = (member: GroupMember) => {
    const beforeMention = newMessage.substring(0, mentionStartPos);
    const afterMention = newMessage.substring(mentionStartPos + mentionSearch.length + 1);
    const newText = `${beforeMention}@${member.full_name} ${afterMention}`;
    
    setNewMessage(newText);
    setSelectedMentions(prev => [...prev, member.user_id]);
    setShowMentions(false);
    setMentionSearch('');
  };

  const filteredMembers = groupMembers.filter(member => 
    member.full_name.toLowerCase().includes(mentionSearch) &&
    member.user_id !== user?.id
  );

  const renderMessageText = (text: string, mentions?: string[]) => {
    if (!mentions || mentions.length === 0) {
      return <span className="whitespace-pre-wrap break-words">{text}</span>;
    }

    // Create a map of user IDs to names for quick lookup
    const mentionedUsers = groupMembers.filter(m => mentions.includes(m.user_id));
    const mentionMap = new Map(mentionedUsers.map(m => [m.full_name, m.user_id]));

    // Split text by @ mentions
    const parts = text.split(/(@\w+(?:\s+\w+)*)/g);
    
    return (
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const name = part.substring(1).trim();
            const userId = mentionMap.get(name);
            if (userId) {
              return (
                <span
                  key={index}
                  className="bg-accent/30 px-1 rounded font-medium"
                >
                  {part}
                </span>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
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
      <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
        <h3 className="font-semibold">Group Chat</h3>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Select value={userLanguage} onValueChange={setUserLanguage}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {messages.map((message) => (
              <div
                key={message.id}
                ref={(el) => {
                  if (el) {
                    messageRefs.current.set(message.id, el);
                  } else {
                    messageRefs.current.delete(message.id);
                  }
                }}
                className={`flex flex-col ${
                  message.user_id === user?.id ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 transition-all duration-300 ${
                    message.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  } ${
                    highlightedMessageId === message.id
                      ? 'ring-2 ring-accent scale-105'
                      : ''
                  }`}
                >
                    <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-medium opacity-70">
                      {message.user_id === user?.id
                        ? 'You'
                        : message.profiles?.full_name || 'Unknown User'}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-60 hover:opacity-100"
                        onClick={() => {
                          if (message.translatedText) {
                            toggleTranslation(message.id);
                          } else {
                            handleTranslateMessage(message.id, message.message);
                          }
                        }}
                        disabled={translatingMessageId === message.id}
                      >
                        {translatingMessageId === message.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Languages className="h-3 w-3" />
                        )}
                      </Button>
                      <Popover open={showEmojiPicker === message.id} onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-60 hover:opacity-100"
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="flex gap-1">
                            {quickEmojis.map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-60 hover:opacity-100"
                        onClick={() => setReplyingTo(message)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {message.replied_message && (
                    <div 
                      className="mb-2 p-2 rounded bg-background/20 border-l-2 border-current cursor-pointer hover:bg-background/30 transition-colors"
                      onClick={() => scrollToMessage(message.replied_message!.id)}
                    >
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
                  
                  <div className="space-y-1">
                    {message.showTranslation && message.translatedText ? (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.translatedText}
                        </p>
                        <p className="text-xs opacity-50 italic">
                          Original: {message.message}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {renderMessageText(message.message, message.mentions)}
                      </p>
                    )}
                  </div>
                  
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
                  
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.reactions.map((reaction) => (
                        <Button
                          key={reaction.emoji}
                          variant="ghost"
                          size="sm"
                          className={`h-6 px-2 text-xs ${
                            reaction.hasReacted ? 'bg-accent' : ''
                          }`}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                        >
                          <span className="mr-1">{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                </div>
                <span>
                  {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
          </>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/50">
        {showMediaRecorder && (
          <div className="mb-3">
            <MediaRecorderComponent
              onRecordingComplete={handleMediaRecording}
              onCancel={() => setShowMediaRecorder(false)}
            />
          </div>
        )}

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
        
        <div className="flex gap-2 relative">
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
            disabled={uploading || sending || showMediaRecorder}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowMediaRecorder(!showMediaRecorder)}
            disabled={uploading || sending}
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={handleMessageInput}
              placeholder="Type a message... Use @ to mention someone"
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto z-50">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Mention member">
                      {filteredMembers.map((member) => (
                        <CommandItem
                          key={member.user_id}
                          onSelect={() => handleMentionSelect(member)}
                          className="cursor-pointer"
                        >
                          <span>@{member.full_name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          
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
          Press Enter to send, Shift+Enter for new line. Use @ to mention members. Click <Mic className="h-3 w-3 inline" /> for voice/video messages.
        </p>
      </form>
    </div>
  );
}
