"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize form values when user data is loaded
  useState(() => {
    if (isLoaded && isSignedIn && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  });

  const handleUpdateProfile = async () => {
    if (!isSignedIn) return;
    
    setIsUpdating(true);
    try {
      await user?.update({
        firstName,
        lastName,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-pulse text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <h1 className="text-2xl font-bold">Please sign in to view your profile</h1>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
        My Profile
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}{user?.lastName?.charAt(0) || ""}</AvatarFallback>
              </Avatar>
              <CardTitle>{user?.fullName || "User"}</CardTitle>
              <CardDescription>{user?.primaryEmailAddress?.emailAddress}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/orders">View Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/store">Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your account details here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input 
                        id="firstName" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input 
                        id="lastName" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-muted-foreground">
                      To change your email, please use the Clerk user settings.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Manage your notification and display preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="marketing" className="rounded text-red-600 focus:ring-red-500" />
                      <Label htmlFor="marketing">Receive marketing emails</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="orders" className="rounded text-red-600 focus:ring-red-500" />
                      <Label htmlFor="orders">Order status notifications</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="darkMode" className="rounded text-red-600 focus:ring-red-500" />
                      <Label htmlFor="darkMode">Dark mode</Label>
                    </div>
                  </div>
                  
                  <Button className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white">
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
