import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "About Us | WesternStreet",
  description: "Learn more about WesternStreet and our story",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600">About WesternStreet</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-red-600">My Story</h2>
            <p className="text-muted-foreground mb-4">
              WesternStreet is an e-commerce project I developed during my internship at Ultimez Technology Pvt Ltd. This project was created to showcase my web development skills and understanding of modern e-commerce platforms.
            </p>
            <p className="text-muted-foreground mb-4">
              As a developer, I built this platform to demonstrate the implementation of features like product browsing, shopping cart functionality, user authentication, and a responsive design that works across all devices.
            </p>
            <p className="text-muted-foreground">
              This project represents my ability to create a complete e-commerce solution with a focus on user experience, modern design principles, and functional shopping features.
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg shadow-sm border border-red-100 dark:border-red-800">
            <h3 className="text-xl font-medium mb-4 text-red-600">Project Overview</h3>
            <p className="text-muted-foreground mb-4">
              This e-commerce platform was developed as part of my internship requirements at Ultimez Technology Pvt Ltd, demonstrating my ability to create a functional online store.
            </p>
            
            <h3 className="text-xl font-medium mb-4 text-red-600 mt-6">Technical Features</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Responsive design using Next.js and TailwindCSS</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>User authentication and account management</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Shopping cart and wishlist functionality</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Product search and filtering capabilities</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-red-600 text-center">Technologies Used</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-red-100 dark:border-red-900">
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-2">Frontend</h3>
                <p className="text-sm text-muted-foreground">
                  Built with Next.js, React, and TailwindCSS to create a responsive and modern user interface with efficient client-side navigation.
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-100 dark:border-red-900">
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Implemented secure user authentication and account management using Clerk for a seamless login experience.
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-100 dark:border-red-900">
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-2">Database</h3>
                <p className="text-sm text-muted-foreground">
                  Managed product data and user information with efficient database structures to ensure fast and reliable performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-red-600 text-center">About the Developer</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden flex-shrink-0 border-4 border-red-200 shadow-md mx-auto md:mx-0">
              <Image 
                src="/images/about/founder.jpg" 
                alt="Developer" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2 text-center md:text-left">Mahima Hovale</h3>
              <p className="text-muted-foreground mb-4">
                With a passion for sneakers and technology, I created WesternStreet to provide a better online shopping experience for sneakers enthusiasts. My background in computer science and love for cosmetics inspired me to build this platform from the ground up.
              </p>
              <p className="text-muted-foreground">
                "I believe that everyone deserves access to high-quality sneakers products that make them feel confident and beautiful. WesternStreet is my way of making that possible."
              </p>
              
              <div className="flex items-center space-x-4 mt-6 justify-center md:justify-start">
                <a 
                  href="https://github.com/mahimahovale/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-muted-foreground hover:text-red-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/mahimahovale" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-muted-foreground hover:text-red-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Explore the Project</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            This project demonstrates my skills in building a fully functional e-commerce platform with modern web technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store">
              <Button className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                Browse the Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
