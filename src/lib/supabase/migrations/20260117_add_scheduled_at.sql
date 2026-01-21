-- Add scheduled_at column to Project table for scheduled publishing
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index for performance since we'll filter by this column often
CREATE INDEX IF NOT EXISTS "idx_project_scheduled_at" ON "Project" ("scheduled_at");

-- Update RLS policy if exists (Optional, depending on your setup)
-- For now, we assume filtering is handled in the application layer or API query.
13:26:20.255 Running build in Washington, D.C., USA (East) – iad1
13:26:20.256 Build machine configuration: 4 cores, 8 GB
13:26:20.388 Cloning github.com/juuuno-coder/vibefolio-nextjs-src (Branch: main, Commit: 21278f5)
13:26:22.449 Cloning completed: 2.061s
13:26:22.663 Restored build cache from previous deployment (978uXo4Sm6NT5hNzKtGWsVHaJSbx)
13:26:23.114 Running "vercel build"
13:26:24.436 Vercel CLI 50.4.4
13:26:24.810 Installing dependencies...
13:26:26.656 
13:26:26.656 up to date in 1s
13:26:26.656 
13:26:26.656 275 packages are looking for funding
13:26:26.656   run `npm fund` for details
13:26:26.690 Detected Next.js version: 14.1.3
13:26:26.695 Running "npm run build"
13:26:26.798 
13:26:26.798 > vibefolio-next-text@0.1.0 build
13:26:26.798 > set NODE_OPTIONS=--max-old-space-size=4096 && next build
13:26:26.798 
13:26:27.461    ▲ Next.js 14.1.3
13:26:27.461 
13:26:27.489    Creating an optimized production build ...
13:26:36.436 Failed to compile.
13:26:36.436 
13:26:36.436 ./src/app/project/upload/page.tsx
13:26:36.437 Error: 
13:26:36.437   [31mx[0m Unexpected token `div`. Expected jsx identifier
13:26:36.437      ,-[[36;1;4m/vercel/path0/src/app/project/upload/page.tsx[0m:744:1]
13:26:36.437  [2m744[0m | 
13:26:36.437  [2m745[0m |   if (isInfoStep) {
13:26:36.437  [2m746[0m |     return (
13:26:36.437  [2m747[0m |       <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-12 px-4 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
13:26:36.437      : [31;1m       ^^^[0m
13:26:36.437  [2m748[0m |         <div className="max-w-4xl mx-auto">
13:26:36.437  [2m749[0m |           <div className="mb-8 flex items-center justify-between">
13:26:36.437  [2m750[0m |             <button
13:26:36.437      `----
13:26:36.437 
13:26:36.438 Caused by:
13:26:36.438     Syntax Error
13:26:36.438 
13:26:36.438 Import trace for requested module:
13:26:36.438 ./src/app/project/upload/page.tsx
13:26:36.438 
13:26:36.438 
13:26:36.438 > Build failed because of webpack errors
13:26:36.500 Error: Command "npm run build" exited with 1