import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [allergies, setAllergies] = useState("");
  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("50");
  const [carbsGoal, setCarbsGoal] = useState("250");
  const [fatsGoal, setFatsGoal] = useState("70");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, age, weight, height, bmi, allergies, calorie_goal, protein_goal, carbs_goal, fats_goal')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFullName(data.full_name || "");
        setAge(data.age?.toString() || "");
        setWeight(data.weight?.toString() || "");
        setHeight(data.height?.toString() || "");
        setBmi(data.bmi?.toString() || "");
        setAllergies(data.allergies || "");
        setCalorieGoal(data.calorie_goal?.toString() || "2000");
        setProteinGoal(data.protein_goal?.toString() || "50");
        setCarbsGoal(data.carbs_goal?.toString() || "250");
        setFatsGoal(data.fats_goal?.toString() || "70");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          allergies: allergies,
          calorie_goal: calorieGoal ? parseFloat(calorieGoal) : 2000,
          protein_goal: proteinGoal ? parseFloat(proteinGoal) : 50,
          carbs_goal: carbsGoal ? parseFloat(carbsGoal) : 250,
          fats_goal: fatsGoal ? parseFloat(fatsGoal) : 70,
          updated_at: new Date().toISOString(),
        },
    { onConflict: 'user_id' } // 🔥 THIS IS THE FIX 
  ) 
        .select('bmi')
        .single();

      if (error) throw error;

      // Fetch updated BMI
      await fetchProfile();

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navigation />
      <main className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gradient-to-br from-primary to-accent p-3">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Weight in kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.1"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Height in cm"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    step="0.1"
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bmi">BMI (Auto-calculated)</Label>
                  <Input
                    id="bmi"
                    type="text"
                    value={bmi || "N/A"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  type="text"
                  placeholder="e.g., Nuts, Dairy, Gluten"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h3 className="text-lg font-semibold">Daily Nutrition Goals</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calorieGoal">Calorie Goal (kcal)</Label>
                    <Input
                      id="calorieGoal"
                      type="number"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(e.target.value)}
                      placeholder="2000"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proteinGoal">Protein Goal (g)</Label>
                    <Input
                      id="proteinGoal"
                      type="number"
                      value={proteinGoal}
                      onChange={(e) => setProteinGoal(e.target.value)}
                      placeholder="50"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbsGoal">Carbs Goal (g)</Label>
                    <Input
                      id="carbsGoal"
                      type="number"
                      value={carbsGoal}
                      onChange={(e) => setCarbsGoal(e.target.value)}
                      placeholder="250"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatsGoal">Fats Goal (g)</Label>
                    <Input
                      id="fatsGoal"
                      type="number"
                      value={fatsGoal}
                      onChange={(e) => setFatsGoal(e.target.value)}
                      placeholder="70"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Account type</p>
                  <p className="text-lg font-semibold mt-1">Free</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
