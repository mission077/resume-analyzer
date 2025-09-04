import { Button } from "@/components/ui/button";
import Link from "next/link";

// app/page.tsx
// This is the landing page
export default function HomePage() {
  return (
    <>
      <h1 className="text-3xl underline">Welcome to Resume Analyzer Rupert!</h1>
      <Button>
        <Link href={"/sign-in"}>Click me</Link>
      </Button>
    </>
      
    ) 
  
}
