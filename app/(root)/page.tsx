import Link from "next/link";

// app/page.tsx
export default function HomePage() {
  return (
    <>
      <h1 className="text-3xl underline">Welcome to Resume Analyzer Rupert!</h1>
      <Link href={"/sign-in"}>
        <button className="bg-blue-500 text-white">Click me</button>
      </Link>
    </>
      
    ) 
  
}
