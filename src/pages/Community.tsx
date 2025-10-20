import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Users, Search, TrendingUp, Heart, BookOpen, Brain, Plus } from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  member_count: number;
  is_public: boolean;
}

interface SharedContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  subject: string;
  likes_count: number;
  created_at: string;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    subject: "",
    description: "",
    is_public: true,
  });

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      const [groupsRes, contentRes] = await Promise.all([
        supabase.from("study_groups").select("*").eq("is_public", true).order("member_count", { ascending: false }).limit(10),
        supabase.from("shared_content").select("*").order("likes_count", { ascending: false }).limit(10),
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (contentRes.error) throw contentRes.error;

      setGroups(groupsRes.data || []);
      setSharedContent(contentRes.data || []);
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

  const handleJoinGroup = async (groupId: string) => {
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user!.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already a member of this group",
        });
        return;
      }

      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user!.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this group",
          });
          return;
        }
        throw error;
      }

      await supabase
        .from("study_groups")
        .update({ member_count: groups.find((g) => g.id === groupId)!.member_count + 1 })
        .eq("id", groupId);

      toast({
        title: "Success",
        description: "You've joined the study group!",
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.subject) {
      toast({
        title: "Missing information",
        description: "Please provide a group name and subject",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("study_groups")
        .insert({
          name: newGroup.name,
          subject: newGroup.subject,
          description: newGroup.description || null,
          is_public: newGroup.is_public,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as a member
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user!.id,
        role: "admin",
      });

      toast({
        title: "Success",
        description: "Study group created successfully!",
      });

      setCreateDialogOpen(false);
      setNewGroup({ name: "", subject: "", description: "", is_public: true });
      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleLikeContent = async (contentId: string) => {
    try {
      const { error } = await supabase.from("content_likes").insert({
        content_id: contentId,
        user_id: user!.id,
      });

      if (error) throw error;

      await supabase
        .from("shared_content")
        .update({
          likes_count: sharedContent.find((c) => c.id === contentId)!.likes_count + 1,
        })
        .eq("id", contentId);

      toast({
        title: "Success",
        description: "Content liked!",
      });

      fetchCommunityData();
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Already liked",
          description: "You've already liked this content",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContent = sharedContent.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community</h1>
            <p className="text-muted-foreground">Connect, learn, and grow together</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>
                  Create a new study group to collaborate with other learners
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Advanced JavaScript Study Group"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., JavaScript"
                    value={newGroup.subject}
                    onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your study group..."
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="public">Public Group</Label>
                  <Switch
                    id="public"
                    checked={newGroup.is_public}
                    onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_public: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={creating}>
                  {creating ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups and content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="groups">
          <TabsList>
            <TabsTrigger value="groups">
              <Users className="mr-2 h-4 w-4" />
              Study Groups
            </TabsTrigger>
            <TabsTrigger value="content">
              <TrendingUp className="mr-2 h-4 w-4" />
              Shared Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4 mt-6">
            {filteredGroups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {group.description || "No description"}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{group.subject}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{group.member_count} members</span>
                        </div>
                        <Button onClick={() => handleJoinGroup(group.id)}>Join Group</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No study groups found</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create the First Group
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-6">
            {filteredContent.length > 0 ? (
              <div className="space-y-4">
                {filteredContent.map((content) => {
                  const Icon = content.content_type === "quiz" ? Brain : BookOpen;
                  return (
                    <Card key={content.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle>{content.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {content.description || "No description"}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary">{content.subject}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeContent(content.id)}
                            >
                              <Heart className="mr-2 h-4 w-4" />
                              {content.likes_count}
                            </Button>
                            <span className="text-sm text-muted-foreground capitalize">
                              {content.content_type}
                            </span>
                          </div>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No shared content found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
