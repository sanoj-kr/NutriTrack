import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, BarChart3, TrendingUp, Apple, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="container px-4 py-16">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-gradient-to-br from-primary to-accent p-4 shadow-lg">
                <Apple className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              NutriTrack
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your nutrition with AI-powered food recognition. 
              Upload photos, get instant nutritional insights, and maintain a healthy lifestyle.
            </p>

            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                <Sparkles className="h-5 w-5" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 pt-12">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Upload className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>AI Food Recognition</CardTitle>
                  <CardDescription>
                    Upload food images and let AI instantly identify and analyze nutritional content
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Smart Dashboard</CardTitle>
                  <CardDescription>
                    Track daily, weekly, and monthly nutrition with beautiful charts and insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Health Insights</CardTitle>
                  <CardDescription>
                    Receive personalized health recommendations based on your eating patterns
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navigation />
      <main className="container py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Welcome to NutriTrack</h1>
            <p className="text-xl text-muted-foreground">
              Your AI-powered nutrition tracking companion
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/upload")}>
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-primary to-accent p-3 w-fit">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Upload Food</CardTitle>
                <CardDescription>
                  Take or upload a photo to analyze nutritional content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Tracking</Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate("/dashboard")}>
              <CardHeader>
                <div className="rounded-full bg-gradient-to-br from-accent to-primary p-3 w-fit">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle>View Dashboard</CardTitle>
                <CardDescription>
                  See your nutrition stats and health insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Stats</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Upload a photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Take or upload a clear picture of your food
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">AI analyzes instantly</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI identifies the food and fetches nutritional data
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Track & improve</h3>
                  <p className="text-sm text-muted-foreground">
                    View insights and make healthier choices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
