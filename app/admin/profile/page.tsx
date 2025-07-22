"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminProfileForm } from "./_components/admin-profile-form"
import { useUser } from "@clerk/nextjs"

export default function AdminProfilePage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  
  // Handle dialog close and refresh
  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    router.refresh();
  };
  
  // If no user is loaded yet, show a loading state
  if (!isLoaded) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
      </AuthGuard>
    )
  }
  
  // If no user is logged in, show an error
  if (!user) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
          <div className="flex items-center justify-center h-96">
            <p>Please log in to access this page.</p>
          </div>
      </AuthGuard>
    )
  }
  
  // If user is not an admin, show an error
  const userRole = user.publicMetadata.role as string | undefined;
  if (userRole !== "admin") {
    return (
      <AuthGuard allowedRoles={["admin"]}>
          <div className="flex items-center justify-center h-96">
            <p>You do not have permission to access this page.</p>
          </div>
      </AuthGuard>
    )
  }
  
  // Use the user data directly from the auth context
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Profile</h1>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                    {user.fullName?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                  <h3 className="text-xl font-semibold">{user.fullName || user.username}</h3>
                  <p className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">Name</div>
                  <div>{user.fullName || user.username}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">Email</div>
                  <div>{user.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">Role</div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">Password</div>
                  <div className="text-muted-foreground">
                    ••••••••
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(true)}
                  className="mt-4"
                >
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Admin Profile</DialogTitle>
            </DialogHeader>
            <AdminProfileForm admin={user} onClose={handleDialogClose} />
          </DialogContent>
        </Dialog>
    </AuthGuard>
  )
} 