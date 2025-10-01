import { Button } from "@/components/ui/button";
import * as Strings from "@/components/ui/strings";
import { Header } from "@/components/ui/header/index";
import Link from "next/link";

// app/page.tsx
// This is the landing page
export default function HomePage() {
  return (
    <>
      <Header/>
      <div className="container mx-auto px-2 flex gap-4 pt-10 pb-6">
        <div className="basis-1/2">
          <h1 className="text-6xl"
              style={{ fontWeight: 'bold' }}>
              {Strings.appTitle}
          </h1>
          <p className="text-xl mt-4">{Strings.appDesc}</p>
        </div>

        <main className="bg-gray-50 rounded-lg basis-1/2">
          <h1 className="text-3xl">
              Change this to image of final results
          </h1>
        </main>
      </div>

      <div className="container mx-auto flex gap-4">
        <div>
          <Button className="md:inline-flex px-6 bg-violet-500">
            <Link href={"/sign-up"}
              style={{ fontWeight: 'bold' }}>
              {Strings.getStarted}</Link>
              <svg className="w-6 h-6 text-gray-50 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
          </Button>
        </div>

        <main>
          <Button className="px-6 bg-gray-50 text-neutral-950">
            <Link href={"/sign-up"}
              style={{ fontWeight: 'bold' }}>
              {Strings.seeHowItWorks}</Link>
          </Button>
        </main>
      </div>

      <div className="container mx-auto px-2 flex gap-4 pt-2">
        <div>
          <p className="text-md mt-4 flex gap-2">
            <svg className="w-6 h-6 text-green-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            {Strings.creditCard}
          </p>
        </div>
        <main>
          <p className="text-md mt-4 flex gap-2">
            <svg className="w-6 h-6 text-blue-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z"/>
            </svg>
            {Strings.privacy}
          </p>
        </main>
      </div>

      <div className="place-items-center py-8 pt-30"
            id="features">
        <h1 style={{ fontWeight: 'bold' }}>
          <p className="text-3xl mt-4">{Strings.featuresTitle}</p>
        </h1>
        <p className="text-md mt-4">{Strings.featuresDesc}</p>
      </div>

      <div className="container flex mx-auto gap-4">
        <div className="basis-1/4 bg-gray-50 rounded-lg mx-auto px-4 py-4">
          <div className="flex gap-2">
            <svg className="w-6 h-6 text-violet-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.5A2.493 2.493 0 0 1 7.51 20H7.5a2.468 2.468 0 0 1-2.4-3.154 2.98 2.98 0 0 1-.85-5.274 2.468 2.468 0 0 1 .92-3.182 2.477 2.477 0 0 1 1.876-3.344 2.5 2.5 0 0 1 3.41-1.856A2.5 2.5 0 0 1 12 5.5m0 13v-13m0 13a2.493 2.493 0 0 0 4.49 1.5h.01a2.468 2.468 0 0 0 2.403-3.154 2.98 2.98 0 0 0 .847-5.274 2.468 2.468 0 0 0-.921-3.182 2.477 2.477 0 0 0-1.875-3.344A2.5 2.5 0 0 0 14.5 3 2.5 2.5 0 0 0 12 5.5m-8 5a2.5 2.5 0 0 1 3.48-2.3m-.28 8.551a3 3 0 0 1-2.953-5.185M20 10.5a2.5 2.5 0 0 0-3.481-2.3m.28 8.551a3 3 0 0 0 2.954-5.185"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.AIAnalysis} 
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.AIDesc}
            </p>
          </div>
        </div>
        <div className="basis-1/4 bg-gray-50 rounded-lg mx-auto px-4 py-4"> 
          <div className="flex gap-2">
            <svg className="w-6 h-6 text-violet-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.resumeTips}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.tipsDesc}
            </p>
          </div>
        </div>
        <div className="basis-1/4 bg-gray-50 rounded-lg mx-auto px-4 py-4"> 
          <div className="flex gap-2">
            <svg className="w-6 h-6 text-violet-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v15a1 1 0 0 0 1 1h15M8 16l2.5-5.5 3 3L17.273 7 20 9.667"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.historyTracking}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.trackingDesc}
            </p>
          </div>
        </div>
        <div className="basis-1/4 bg-gray-50 rounded-lg mx-auto px-4 py-4"> 
            <div className="flex gap-2">
            <svg className="w-6 h-6 text-violet-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.performanceMetrics}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.metricsDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="place-items-center py-8 pt-30"
            id="how-it-works">
        <h1 style={{ fontWeight: 'bold' }}>
          <p className="text-3xl mt-4">{Strings.howItWorks}</p>
        </h1>
        <p className="text-md mt-4">{Strings. worksDesc}</p>
      </div>

      <div className="container flex mx-auto gap-4">
        <div className="basis-1/3 bg-gray-50 rounded-lg mx-auto px-4 py-4">
          <p style={{ fontWeight: 'bold' }}
            className="md:inline-flex p-1 px-3 bg-violet-200 text-violet-500 rounded-full">1</p>
          <div className="flex gap-2 pt-2">
            <svg className="w-6 h-6 text-violet-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.upload}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.uploadDesc}
            </p>
          </div>
        </div>
        <div className="basis-1/3 bg-gray-50 rounded-lg mx-auto px-4 py-4"> 
          <p style={{ fontWeight: 'bold' }}
            className="md:inline-flex p-1 px-3 bg-violet-200 text-violet-500 rounded-full">2</p>
          <div className="flex gap-2 pt-2">
            <svg className="w-6 h-6 text-violet-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.5A2.493 2.493 0 0 1 7.51 20H7.5a2.468 2.468 0 0 1-2.4-3.154 2.98 2.98 0 0 1-.85-5.274 2.468 2.468 0 0 1 .92-3.182 2.477 2.477 0 0 1 1.876-3.344 2.5 2.5 0 0 1 3.41-1.856A2.5 2.5 0 0 1 12 5.5m0 13v-13m0 13a2.493 2.493 0 0 0 4.49 1.5h.01a2.468 2.468 0 0 0 2.403-3.154 2.98 2.98 0 0 0 .847-5.274 2.468 2.468 0 0 0-.921-3.182 2.477 2.477 0 0 0-1.875-3.344A2.5 2.5 0 0 0 14.5 3 2.5 2.5 0 0 0 12 5.5m-8 5a2.5 2.5 0 0 1 3.48-2.3m-.28 8.551a3 3 0 0 1-2.953-5.185M20 10.5a2.5 2.5 0 0 0-3.481-2.3m.28 8.551a3 3 0 0 0 2.954-5.185"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.analyze}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.analyzeDesc}
            </p>
          </div>
        </div>
        <div className="basis-1/3 bg-gray-50 rounded-lg mx-auto px-4 py-4"> 
          <p style={{ fontWeight: 'bold' }}
            className="md:inline-flex p-1 px-3 bg-violet-200 text-violet-500 rounded-full">3</p>
          <div className="flex gap-2 pt-2">
            <svg className="w-6 h-6 text-violet-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <p style={{ fontWeight: 'bold' }}> 
              {Strings.improve}
            </p>
          </div>
          <div>
            <p className="text-sm mt-2"> 
              {Strings.improveDesc}
            </p>
          </div>
        </div>
      </div>

    {/* add the dashboard link*/}
      <div className="py-12 mx-auto text-center">
        <Button className="hidden md:inline-flex bg-violet-500 px-6">
          <Link href={"/#"}
              style={{ fontWeight: 'bold' }}>
              {Strings.uploadResume}</Link>
        </Button>
      </div>
    </>
      
    ) 
  
}