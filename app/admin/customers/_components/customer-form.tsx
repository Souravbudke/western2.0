"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/lib/auth-provider"
import { Loader2 } from "lucide-react"

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

// Form schema for validation
const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "customer"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>

interface CustomerFormProps {
  customer?: {
    id: string
    name: string
    email: string
    role: "admin" | "customer"
  }
  onClose?: () => void
}

export function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!customer

  // Initialize form with customer data or defaults
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? {
      name: customer.name || '',
      email: customer.email || '',
      role: customer.role || 'customer',
      password: '',
    } : {
      name: "",
      email: "",
      role: "customer",
      password: "",
    },
  })

  // Form submission handler
  async function onSubmit(values: CustomerFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Create form data to send
      const formData: any = {
        name: values.name,
        email: values.email,
        role: values.role,
      }
      
      // Only include password if it's provided and not empty
      if (values.password && values.password.trim() !== '') {
        formData.password = values.password;
      }
      
      if (isEditing && customer) {
        // Update existing customer via API using absolute URL
        const apiUrl = `${getBaseUrl()}/api/users/${customer.id}`;
        console.log('Updating customer at:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(formData),
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to update user: ${response.status} ${response.statusText}`);
        }
        
        toast({
          title: "Customer updated",
          description: "Customer information has been updated successfully.",
        });
      } else {
        // Password is required for new users
        if (!formData.password) {
          toast({
            title: "Password required",
            description: "Password is required when creating a new user.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Create new customer via API using absolute URL
        const apiUrl = `${getBaseUrl()}/api/users`;
        console.log('Creating customer at:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(formData),
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to create user: ${response.status} ${response.statusText}`);
        }
        
        toast({
          title: "Customer created",
          description: "New customer has been created successfully.",
        });
      }
      
      // Force a refresh to get the latest data
      router.refresh();
      
      // Delay the dialog close slightly to ensure state is updated
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 300);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitError(error.message || "There was an error processing your request.");
      toast({
        title: isEditing ? "Failed to update customer" : "Failed to create customer",
        description: error.message || "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Customer name" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="customer@example.com" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Set the user's role and permissions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submitError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
            {submitError}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Customer" : "Create Customer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 