import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Brototype Complaint System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A centralized platform for students to submit complaints and track their resolution status
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Easy Submission</h3>
              <p className="text-sm text-muted-foreground">
                Submit complaints with detailed descriptions and category selection
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Track Status</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your complaint status from pending to resolution
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Admin Support</h3>
              <p className="text-sm text-muted-foreground">
                Get responses and updates directly from the admin team
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
            Register as Student
          </Button>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built for Brototype students and administrators</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
