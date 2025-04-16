'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-red-500/4 border-2 border-red-200 text-red-800 p-5 rounded-lg mx-auto my-5 max-w-3xl shadow-lg">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Page on the way!</h1>
      <p className="text-xl md:text-2xl mb-12 text-center">Please head back to the main page</p>
      
      <Link href="/" passHref>
        <Button 
          size="lg"
          className="flex items-center gap-2 bg-transparent text-red-800 hover:bg-gray-100 border-2 shadow-md frosted"
        >
          <ArrowLeft size={20} />
          Return Home
        </Button>
      </Link>
    </div>
  );
}