import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GroupChat } from "@/components/community/GroupChat";
import { Users, ArrowLeft, BookOpen, Brain, Share2, Copy, Check } from "lucide-react";

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  member_count: number;
  is_public: boolean;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchGroupDetails();
    }
  }, [id, user]);

  const fetchGroupDetails = async () => {
    try {
      const [groupRes, membersRes, membershipRes] = await Promise.all([
        supabase.from("study_groups").select("*").eq("id", id).single(),
        supabase.from("group_members").select("*").eq("group_id", id),
        supabase.from("group_members").select("id").eq("group_id", id).eq("user_id", user!.id).single(),
      ]);

      if (groupRes.error) throw groupRes.error;
      if (membersRes.error) throw membersRes.error;

      setGroup(groupRes.data);
      setMembers(membersRes.data || []);
      setIsMember(!!membershipRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!group) return;
    
    setJoining(true);
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user!.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this group",
          });
          setIsMember(true);
          return;
        }
        throw error;
      }

      await supabase
        .from("study_groups")
        .update({ member_count: group.member_count + 1 })
        .eq("id", group.id);

      toast({
        title: "Success",
        description: "You've joined the study group!",
      });

      fetchGroupDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    
    setJoining(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user!.id);

      if (error) throw error;

      await supabase
        .from("study_groups")
        .update({ member_count: Math.max(0, group.member_count - 1) })
        .eq("id", group.id);

      toast({
        title: "Success",
        description: "You've left the study group",
      });

      fetchGroupDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = async () => {
    const inviteLink = window.location.href;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link to invite others to join the group",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <p className="text-muted-foreground">Group not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/community")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{group.name}</CardTitle>
                  <Badge variant="secondary">{group.subject}</Badge>
                </div>
                <CardDescription className="text-base">
                  {group.description || "No description provided"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group.member_count} members</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
                {isMember ? (
                  <Button variant="outline" onClick={handleLeaveGroup} disabled={joining}>
                    {joining ? "Leaving..." : "Leave Group"}
                  </Button>
                ) : (
                  <Button onClick={handleJoinGroup} disabled={joining}>
                    {joining ? "Joining..." : "Join Group"}
                  </Button>
                )}
              </div>
            </div>

            {group.is_public && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Share2 className="h-4 w-4" />
                  Invite Link
                </div>
                <div className="flex gap-2">
                  <Input
                    value={window.location.href}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with others to invite them to join the group
                </p>
              </div>
            )}

            {isMember && (
              <div className="border-t pt-4 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Group Chat</h3>
                  <GroupChat groupId={id!} />
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Shared Resources</h3>
                  <Card>
                    <CardContent className="py-6 text-center">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Shared resources and study materials will appear here
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {!isMember && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Join this group to access shared resources and discussions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
