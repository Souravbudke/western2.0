"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserPlus, RefreshCw, Trash2, Mail, ExternalLink, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CustomerForm } from "./_components/customer-form"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
// We'll fetch Clerk users from our API endpoint instead of directly

// Helper function to get the base URL
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use current path
    return window.location.origin;
  }
  // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost
  return 'http://localhost:3000';
}

// Format date to readable string
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [clerkUsers, setClerkUsers] = useState<any[]>([])
  const [customersOrdersData, setCustomersOrdersData] = useState<any[][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [deleteCustomerName, setDeleteCustomerName] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const { toast } = useToast()
  const router = useRouter()
  
  const fetchCustomerData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch legacy customers from the API
      const apiUrl = `${getBaseUrl()}/api/users`;
      console.log('Fetching legacy customers from:', apiUrl);
      
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const response = await fetch(`${apiUrl}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch legacy customers: ${response.status} ${response.statusText}`);
      }
      
      const allUsers = await response.json();
      console.log(`Fetched ${allUsers.length} legacy users`);
      
      const customersData = allUsers.filter((user: any) => user?.role === "customer");
      setCustomers(customersData);
      
      // Fetch Clerk users
      try {
        const clerkApiUrl = `${getBaseUrl()}/api/clerk-users`;
        console.log('Fetching Clerk users from:', clerkApiUrl);
        
        const clerkResponse = await fetch(`${clerkApiUrl}?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (clerkResponse.ok) {
          const clerkUsersData = await clerkResponse.json();
          console.log(`Fetched ${clerkUsersData.length} Clerk users`);
          setClerkUsers(clerkUsersData);
        } else {
          console.error(`Failed to fetch Clerk users: ${clerkResponse.status} ${clerkResponse.statusText}`);
        }
      } catch (clerkError) {
        console.error('Error fetching Clerk users:', clerkError);
      }
      
      // Fetch orders for each customer individually using the improved getUserOrders function
      try {
        console.log('Fetching orders for each customer individually...');
        
        // Create an array of promises to fetch orders for each customer
        const orderPromises = customersData.map(async (customer: any) => {
          if (!customer || !customer.id) return [];
          
          try {
            // Use the userId parameter to fetch orders for this specific customer
            // This will use our improved getUserOrders function that handles both MongoDB IDs and Clerk IDs
            const ordersApiUrl = `${getBaseUrl()}/api/orders?userId=${customer.id}`;
            const response = await fetch(ordersApiUrl, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              cache: 'no-store',
              next: { revalidate: 0 }
            });
            
            if (!response.ok) {
              console.error(`Failed to fetch orders for customer ${customer.id}: ${response.status}`);
              return [];
            }
            
            const customerOrders = await response.json();
            console.log(`Fetched ${customerOrders.length} orders for customer ${customer.id}`);
            return customerOrders;
          } catch (error) {
            console.error(`Error fetching orders for customer ${customer.id}:`, error);
            return [];
          }
        });
        
        // Wait for all order fetches to complete
        const ordersData = await Promise.all(orderPromises);
        console.log(`Completed fetching orders for ${ordersData.length} customers`);
        
        setCustomersOrdersData(ordersData);
      } catch (orderError) {
        console.error("Error fetching customer orders:", orderError);
        // Don't fail the whole operation if we can't fetch orders
        setCustomersOrdersData(customersData.map(() => []));
      }
      
      // Update last refreshed time
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching customers data:", error);
      toast({
        title: "Error loading customers",
        description: "Failed to load customer data. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData, refreshTrigger]);

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    // Force a refresh of the data
    setRefreshTrigger(prev => prev + 1);
    // Force router refresh too
    router.refresh();
  };
  
  const handleDeleteClick = (customerId: string, customerName: string) => {
    setDeleteCustomerId(customerId);
    setDeleteCustomerName(customerName);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteCustomerId) return;
    
    setIsDeleting(true);
    try {
      const apiUrl = `${getBaseUrl()}/api/users/${deleteCustomerId}`;
      console.log('Deleting customer at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: "Customer deleted",
        description: `${deleteCustomerName} has been deleted successfully.`,
      });
      
      // Remove the deleted customer from state immediately
      setCustomers(prev => prev.filter(customer => customer.id !== deleteCustomerId));
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      
      // Force a refresh of the data
      setRefreshTrigger(prev => prev + 1);
      // Force router refresh too
      router.refresh();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Failed to delete customer",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="secondary"
            onClick={async () => {
              try {
                toast({
                  title: "Syncing Clerk Users",
                  description: "Importing Clerk users to database...",
                }); 
                
                const response = await fetch('/api/sync-clerk-users', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  toast({
                    title: "Sync Complete",
                    description: data.message,
                    variant: "default",
                  });
                  // Refresh the data
                  setRefreshTrigger(prev => prev + 1);
                } else {
                  toast({
                    title: "Sync Failed",
                    description: data.error || "Failed to sync users",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Sync Error",
                  description: "An unexpected error occurred",
                  variant: "destructive",
                });
              }
            }}
            className="flex items-center justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Users
          </Button>
          {/* <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="flex items-center justify-center"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button> */}
        </div>
      </div>

      {/* Customers Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Customer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Loading customers...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile view - card layout */}
              <div className="sm:hidden space-y-4">
                {customers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No customers found.
                  </p>
                ) : (
                  customers.map((customer, index) => {
                    if (!customer) return null;
                    const customerOrders = customersOrdersData[index] || [];
                    
                    return (
                      <div key={customer.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="mr-2 flex-1">
                            <h3 className="font-medium text-sm truncate">{customer.name}</h3>
                            {/* <p className="text-xs text-muted-foreground flex items-center truncate">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </p> */}
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center justify-center flex-shrink-0">
                            <span className="tabular-nums">{customerOrders.length}</span>
                            <span className="ml-0.5 text-[10px]">orders</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-full"
                            asChild
                          >
                            <Link href={`/admin/customers/${customer.id}`}>
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              <span className="text-xs">View</span>
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleDeleteClick(customer.id, customer.name)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Desktop view - table layout */}
              <table className="w-full text-sm hidden sm:table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-3">Name</th>
                    <th className="text-left font-medium p-3">Email</th>
                    <th className="text-right font-medium p-3">Orders</th>
                    <th className="text-right font-medium p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, index) => {
                      if (!customer) return null;
                      const customerOrders = customersOrdersData[index] || [];
                      
                      return (
                        <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{customer.name}</td>
                          <td className="p-3">{customer.email}</td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {customerOrders.length}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8"
                                asChild
                              >
                                <Link href={`/admin/customers/${customer.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => handleDeleteClick(customer.id, customer.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Customer Dialog
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onClose={handleDialogClose} />
        </DialogContent>
      </Dialog>
       */}
      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteCustomerName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
