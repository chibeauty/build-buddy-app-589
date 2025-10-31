import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ShareContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "quiz" | "flashcard_deck";
  contentId: string;
  contentTitle: string;
}

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  member_count: number;
}

export function ShareContentDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
}: ShareContentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserGroups();
      // Set default message
      setMessage(`Check out this ${contentType === "quiz" ? "quiz" : "flashcard deck"}: ${contentTitle}`);
    }
  }, [open, user, contentType, contentTitle]);

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          study_groups (
            id,
            name,
            subject,
            member_count
          )
        `)
        .eq("user_id", user!.id);

      if (error) throw error;

      const groupsData = data
        .map((item: any) => item.study_groups)
        .filter(Boolean) as StudyGroup[];
      
      setGroups(groupsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedGroup) {
      toast({
        title: "No group selected",
        description: "Please select a group to share with",
        variant: "destructive",
      });
      return;
    }

    setSharing(true);
    try {
      // Create a message with content link
      const contentUrl = contentType === "quiz" 
        ? `/quizzes/${contentId}`
        : `/flashcards/${contentId}`;

      const attachments = [{
        type: contentType,
        title: contentTitle,
        url: contentUrl,
        id: contentId,
      }];

      const { error } = await supabase
        .from("group_messages")
        .insert({
          group_id: selectedGroup,
          user_id: user!.id,
          message: message,
          attachments: attachments,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content shared to group successfully!",
      });

      onOpenChange(false);
      setSelectedGroup("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Group</DialogTitle>
          <DialogDescription>
            Share this {contentType === "quiz" ? "quiz" : "flashcard deck"} with your study groups
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              You're not a member of any study groups yet
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select Group</Label>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  <RadioGroup value={selectedGroup} onValueChange={setSelectedGroup}>
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-start space-x-2">
                          <RadioGroupItem value={group.id} id={group.id} />
                          <Label
                            htmlFor={group.id}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.subject} • {group.member_count} members
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </ScrollArea>
              </div>

              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Add a message to share with the group..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sharing}
              >
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={sharing || !selectedGroup}>
                {sharing ? "Sharing..." : "Share"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
