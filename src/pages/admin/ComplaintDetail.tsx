import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Send, Paperclip, Download, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_review" | "resolved";
  created_at: string;
  student_id: string;
  categories: { name: string } | null;
  profiles: { name: string; email: string; batch: string | null } | null;
}

interface Comment {
  id: string;
  message: string;
  created_at: string;
  profiles: { name: string } | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaint();
    fetchComments();
    fetchAttachments();
  }, [id]);

  const fetchComplaint = async () => {
    const { data: complaintData, error } = await supabase
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
      setLoading(false);
      return;
    }

    // Fetch profile separately
    const { data: profileData } = await supabase
      .from("profiles")
      .select("name, email, batch")
      .eq("id", complaintData.student_id)
      .single();

    setComplaint({
      ...complaintData,
      profiles: profileData || null
    });
    setNewStatus(complaintData.status);
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

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from("complaint_attachments")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      setAttachments(data);
    }
  };

  const downloadAttachment = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("complaint-attachments")
      .download(filePath);

    if (error) {
      toast({
        title: "Error downloading file",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = async () => {
    if (!complaint || newStatus === complaint.status) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus as "pending" | "in_review" | "resolved" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: "The complaint status has been updated successfully",
      });
      fetchComplaint();
    }
    setSubmitting(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Not authenticated",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      complaint_id: id,
      user_id: user.id,
      message: newComment,
    });

    if (error) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      setNewComment("");
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting complaint",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Complaint deleted",
        description: "The complaint has been deleted successfully",
      });
      navigate("/admin/dashboard");
    }
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
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Complaint</h1>
            <StatusBadge status={complaint.status} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{complaint.title}</CardTitle>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex gap-4">
                <span>
                  Student:{" "}
                  <button
                    onClick={() => navigate(`/admin/student/${complaint.student_id}`)}
                    className="text-primary hover:underline"
                  >
                    {complaint.profiles?.name || "Unknown"}
                  </button>
                </span>
                <span>Email: {complaint.profiles?.email || "N/A"}</span>
                {complaint.profiles?.batch && <span>Batch: {complaint.profiles.batch}</span>}
              </div>
              <div className="flex gap-4">
                <span>Category: {complaint.categories?.name || "Uncategorized"}</span>
                <span>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap mb-6">{complaint.description}</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <div className="flex gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={submitting || newStatus === complaint.status}
                  >
                    Update
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={submitting}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Complaint
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the complaint and all associated comments and attachments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {attachments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.file_size / 1024).toFixed(1)} KB • {new Date(attachment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments & Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comments.length > 0 && (
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
                  <Separator className="my-4" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Add Comment</label>
                <Textarea
                  placeholder="Add a comment for the student..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminComplaintDetail;
