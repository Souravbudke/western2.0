import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-purple-50 to-red-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600">
            WesternStreet
          </h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-red-600 hover:bg-red-700",
              footerActionLink: "text-red-600 hover:text-red-700",
            },
          }}
          redirectUrl="/store"
        />
      </div>
    </div>
  );
}
