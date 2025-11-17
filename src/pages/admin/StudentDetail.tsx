import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Calendar, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  batch: string | null;
  created_at: string;
}

interface StudentComplaint {
  id: string;
  title: string;
  status: "pending" | "in_review" | "resolved";
  created_at: string;
  categories: { name: string } | null;
}

const StudentDetail = () => {
  const { id } = useParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [complaints, setComplaints] = useState<StudentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentDetails();
    fetchStudentComplaints();
  }, [id]);

  const fetchStudentDetails = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error loading student details",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setStudent(data);
    setLoading(false);
  };

  const fetchStudentComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("id, title, status, created_at, categories(name)")
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setComplaints(data);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Student not found</p>
            <Button onClick={() => navigate("/admin/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Student Details</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{student.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="text-sm">{student.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="text-sm">{student.batch || "Not specified"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Registered
                </p>
                <p className="text-sm">
                  {new Date(student.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Complaints History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total complaints: {complaints.length}
              </p>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No complaints filed yet
                </p>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium">{complaint.title}</h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              {complaint.categories && (
                                <span className="px-2 py-1 bg-secondary rounded-md">
                                  {complaint.categories.name}
                                </span>
                              )}
                              <span>
                                {new Date(complaint.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={complaint.status} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDetail;
