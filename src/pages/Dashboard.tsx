import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Activity, TrendingUp, TrendingDown, AlertTriangle, Target, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface FoodLog {
  id: string;
  food_name: string;
  image_url: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  sugar: number;
  sodium: number;
  created_at: string;
}

interface DailyStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalSugar: number;
  totalSodium: number;
}

interface UserGoals {
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fats_goal: number;
}

export default function Dashboard() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    totalSugar: 0,
    totalSodium: 0,
  });
  const [userGoals, setUserGoals] = useState<UserGoals>({
    calorie_goal: 2000,
    protein_goal: 50,
    carbs_goal: 250,
    fats_goal: 70,
  });
  const [loading, setLoading] = useState(true);
  const [goalAlertShown, setGoalAlertShown] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchFoodLogs(selectedDate);
    setGoalAlertShown(false);
  }, [selectedDate]);

  const fetchFoodLogs = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('calorie_goal, protein_goal, carbs_goal, fats_goal')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserGoals({
          calorie_goal: profile.calorie_goal || 2000,
          protein_goal: profile.protein_goal || 50,
          carbs_goal: profile.carbs_goal || 250,
          fats_goal: profile.fats_goal || 70,
        });
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFoodLogs(data || []);
      
      // Calculate daily totals
      const stats = (data || []).reduce((acc, log) => ({
        totalCalories: acc.totalCalories + (Number(log.calories) || 0),
        totalProtein: acc.totalProtein + (Number(log.protein) || 0),
        totalCarbs: acc.totalCarbs + (Number(log.carbohydrates) || 0),
        totalFats: acc.totalFats + (Number(log.fats) || 0),
        totalSugar: acc.totalSugar + (Number(log.sugar) || 0),
        totalSodium: acc.totalSodium + (Number(log.sodium) || 0),
      }), {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        totalSugar: 0,
        totalSodium: 0,
      });

      setDailyStats(stats);

      // Check if calorie goal reached and show notification (only for today)
      const isToday = date.toDateString() === new Date().toDateString();
      if (isToday && profile && stats.totalCalories >= profile.calorie_goal && !goalAlertShown) {
        toast.success("You've reached your daily calorie goal!", {
          description: `Consumed: ${stats.totalCalories.toFixed(0)} / ${profile.calorie_goal} kcal`,
        });
        setGoalAlertShown(true);
      }
    } catch (error) {
      console.error('Error fetching food logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNutritionSuggestions = () => {
    const suggestions = [];

    // Check for deficiencies (less than 70% of goal)
    if (dailyStats.totalProtein < userGoals.protein_goal * 0.7) {
      suggestions.push({
        title: "Low Protein",
        message: "You're low on protein today. Try: eggs, milk, paneer, chicken, fish, lentils, chickpeas.",
        type: "info",
        icon: TrendingDown,
      });
    }

    if (dailyStats.totalCarbs < userGoals.carbs_goal * 0.7) {
      suggestions.push({
        title: "Low Carbohydrates",
        message: "Consider adding: rice, whole wheat bread, potatoes, oats, quinoa, sweet potatoes.",
        type: "info",
        icon: TrendingDown,
      });
    }

    if (dailyStats.totalFats < userGoals.fats_goal * 0.7) {
      suggestions.push({
        title: "Low Healthy Fats",
        message: "Add more: nuts, avocado, olive oil, seeds, ghee, fatty fish like salmon.",
        type: "info",
        icon: TrendingDown,
      });
    }

    // Check for excess
    if (dailyStats.totalSugar > 50) {
      suggestions.push({
        title: "High Sugar Intake",
        message: "Try to avoid: sodas, candies, pastries, sweetened beverages. Limit fruits high in sugar.",
        type: "warning",
        icon: TrendingUp,
      });
    }

    if (dailyStats.totalSodium > 2300) {
      suggestions.push({
        title: "High Sodium",
        message: "Reduce: processed foods, chips, pickles, canned soups. Use less table salt.",
        type: "warning",
        icon: TrendingUp,
      });
    }

    if (dailyStats.totalCalories > userGoals.calorie_goal) {
      suggestions.push({
        title: "Calorie Goal Exceeded",
        message: "You've exceeded your calorie goal. Consider lighter meals for the rest of the day.",
        type: "warning",
        icon: TrendingUp,
      });
    }

    return suggestions;
  };

  const getChartData = () => {
    return [
      {
        name: 'Calories',
        consumed: dailyStats.totalCalories,
        goal: userGoals.calorie_goal,
      },
      {
        name: 'Protein (g)',
        consumed: dailyStats.totalProtein,
        goal: userGoals.protein_goal,
      },
      {
        name: 'Carbs (g)',
        consumed: dailyStats.totalCarbs,
        goal: userGoals.carbs_goal,
      },
      {
        name: 'Fats (g)',
        consumed: dailyStats.totalFats,
        goal: userGoals.fats_goal,
      },
    ];
  };

  const suggestions = getNutritionSuggestions();

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <Navigation />
        <main className="container py-8">
          <div className="animate-pulse text-center text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navigation />
      <main className="container py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isToday ? "Today's" : format(selectedDate, "MMMM d, yyyy")} Nutrition Dashboard
              </h1>
              <p className="text-muted-foreground">Track your daily intake and nutrition goals</p>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2 justify-center">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextDay}
              disabled={isToday}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {!isToday && (
              <Button variant="secondary" onClick={() => setSelectedDate(new Date())}>
                Today
              </Button>
            )}
          </div>
        </div>

        {/* Goal Progress Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Calories
              </CardTitle>
              <CardDescription>Goal: {userGoals.calorie_goal} kcal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                {dailyStats.totalCalories.toFixed(0)} / {userGoals.calorie_goal}
              </div>
              <Progress 
                value={Math.min((dailyStats.totalCalories / userGoals.calorie_goal) * 100, 100)} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {((dailyStats.totalCalories / userGoals.calorie_goal) * 100).toFixed(0)}% of goal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-primary" />
                Protein
              </CardTitle>
              <CardDescription>Goal: {userGoals.protein_goal}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                {dailyStats.totalProtein.toFixed(1)} / {userGoals.protein_goal}g
              </div>
              <Progress 
                value={Math.min((dailyStats.totalProtein / userGoals.protein_goal) * 100, 100)} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {((dailyStats.totalProtein / userGoals.protein_goal) * 100).toFixed(0)}% of goal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Carbohydrates
              </CardTitle>
              <CardDescription>Goal: {userGoals.carbs_goal}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                {dailyStats.totalCarbs.toFixed(1)} / {userGoals.carbs_goal}g
              </div>
              <Progress 
                value={Math.min((dailyStats.totalCarbs / userGoals.carbs_goal) * 100, 100)} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {((dailyStats.totalCarbs / userGoals.carbs_goal) * 100).toFixed(0)}% of goal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-primary" />
                Fats
              </CardTitle>
              <CardDescription>Goal: {userGoals.fats_goal}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                {dailyStats.totalFats.toFixed(1)} / {userGoals.fats_goal}g
              </div>
              <Progress 
                value={Math.min((dailyStats.totalFats / userGoals.fats_goal) * 100, 100)} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {((dailyStats.totalFats / userGoals.fats_goal) * 100).toFixed(0)}% of goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nutrition Overview</CardTitle>
            <CardDescription>Compare consumed vs goal nutrients</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="consumed" fill="hsl(var(--primary))" name="Consumed" />
                <Bar dataKey="goal" fill="hsl(var(--muted-foreground))" name="Goal" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Nutrition Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Nutrition Suggestions</h2>
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <Alert key={index} variant={suggestion.type === "warning" ? "destructive" : "default"}>
                  <Icon className="h-4 w-4" />
                  <AlertTitle>{suggestion.title}</AlertTitle>
                  <AlertDescription>{suggestion.message}</AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Sugar Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyStats.totalSugar.toFixed(1)}g</div>
              <p className="text-sm text-muted-foreground mt-1">
                {dailyStats.totalSugar > 50 ? "⚠️ High - Recommended limit: 50g" : "✓ Within healthy range"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Sodium Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyStats.totalSodium.toFixed(0)}mg</div>
              <p className="text-sm text-muted-foreground mt-1">
                {dailyStats.totalSodium > 2300 ? "⚠️ High - Recommended limit: 2300mg" : "✓ Within healthy range"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Food Log */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{isToday ? "Today's" : format(selectedDate, "MMMM d, yyyy")} Food Log</CardTitle>
          </CardHeader>
          <CardContent>
            {foodLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No food logged on this day.
              </p>
            ) : (
              <div className="space-y-4">
                {foodLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-lg border border-border hover:border-primary transition-colors">
                    <img
                      src={log.image_url}
                      alt={log.food_name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{log.food_name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{log.calories} kcal</Badge>
                        <Badge variant="outline">P: {log.protein}g</Badge>
                        <Badge variant="outline">C: {log.carbohydrates}g</Badge>
                        <Badge variant="outline">F: {log.fats}g</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
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
}
