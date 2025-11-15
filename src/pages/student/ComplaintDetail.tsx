import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_review" | "resolved";
  created_at: string;
  categories: { name: string } | null;
}

interface Comment {
  id: string;
  message: string;
  created_at: string;
  profiles: { name: string } | null;
}

const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaint();
    fetchComments();
  }, [id]);

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*, categories(name)")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error loading complaint",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setComplaint(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (error || !commentsData) return;

    // Fetch profiles for comment authors
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    
    const enrichedComments = commentsData.map(comment => ({
      ...comment,
      profiles: profilesMap.get(comment.user_id) ? { name: profilesMap.get(comment.user_id)!.name } : null
    }));

    setComments(enrichedComments);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Complaint not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/student/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Complaint Details</h1>
            <StatusBadge status={complaint.status} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{complaint.title}</CardTitle>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Category: {complaint.categories?.name || "Uncategorized"}</span>
              <span>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{complaint.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Admin Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No updates yet. You'll see admin responses here.
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={comment.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {comment.profiles?.name || "Admin"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ComplaintDetail;
