import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudyPlans() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold">My Study Plans</h2>
          <Button onClick={() => navigate("/study-plans/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Sample Study Plan</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[60%] transition-all" />
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
