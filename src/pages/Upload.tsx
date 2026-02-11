import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please login first");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // ✅ Convert file to base64 for Gemini
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      const user = session.user;

      // Upload image to storage (keep this for saving image URL)
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("food-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("food-images").getPublicUrl(fileName);

      // ✅ Convert image to base64 for Gemini
      const base64Image = await toBase64(file);

      // ✅ Call Gemini Edge Function
      const { data: analysisData, error: analysisError } =
      await supabase.functions.invoke("analyze-food", {
      body: { imageBase64: base64Image },
  });


      if (analysisError) throw analysisError;

      // Save to database
      const { error: insertError } = await supabase.from("food_logs").insert({
        user_id: user.id,
        food_name: analysisData.foodName,
        image_url: publicUrl,
        calories: analysisData.nutrition.calories,
        protein: analysisData.nutrition.protein,
        carbohydrates: analysisData.nutrition.carbohydrates,
        fats: analysisData.nutrition.fats,
        sugar: analysisData.nutrition.sugar,
        sodium: analysisData.nutrition.sodium,
        confidence_score: analysisData.confidence,
        serving_size: analysisData.servingSize,
      });

      if (insertError) throw insertError;

      toast.success("Food analyzed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to analyze food");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navigation />
      <main className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              Upload Food Image
            </CardTitle>
            <CardDescription>
              Take or upload a photo of your food and let AI analyze its nutritional content
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Food preview"
                    className="max-h-64 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </label>
              )}
            </div>

            {file && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {analyzing ? "Analyzing..." : "Uploading..."}
                  </>
                ) : (
                  "Analyze Food"
                )}
              </Button>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">
                Tips for best results:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure good lighting and clear image</li>
                <li>• Capture the entire food item or meal</li>
                <li>• Avoid blurry or dark photos</li>
                <li>• One food item per photo works best</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}




/*import { useEffect } from "react";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login first");
      navigate("/login");
    }
  };

  checkAuth();
}, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);

    try {
      //const { data: { user } } = await supabase.auth.getUser();
      //if (!user) throw new Error("Not authenticated");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
      throw new Error("Not authenticated");
}

const user = session.user;


      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      // Call edge function to analyze food
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-food', {
        body: { imageUrl: publicUrl }
      });

      if (analysisError) throw analysisError;

      // Save to database
      const { error: insertError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          food_name: analysisData.foodName,
          image_url: publicUrl,
          calories: analysisData.nutrition.calories,
          protein: analysisData.nutrition.protein,
          carbohydrates: analysisData.nutrition.carbohydrates,
          fats: analysisData.nutrition.fats,
          sugar: analysisData.nutrition.sugar,
          sodium: analysisData.nutrition.sodium,
          confidence_score: analysisData.confidence,
          serving_size: analysisData.servingSize
        });

      if (insertError) throw insertError;

      toast.success("Food analyzed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to analyze food");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Navigation />
      <main className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Food Image</CardTitle>
            <CardDescription>
              Take or upload a photo of your food and let AI analyze its nutritional content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Food preview"
                    className="max-h-64 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </label>
              )}
            </div>

            {file && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {analyzing ? "Analyzing..." : "Uploading..."}
                  </>
                ) : (
                  "Analyze Food"
                )}
              </Button>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Tips for best results:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure good lighting and clear image</li>
                <li>• Capture the entire food item or meal</li>
                <li>• Avoid blurry or dark photos</li>
                <li>• One food item per photo works best</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}*/
