-- Create Notifications Table
CREATE TABLE IF NOT EXISTS "public"."Notifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL, -- Foreign Key to Users table
    "message" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."Users"("User_id")
);

-- Enable RLS
ALTER TABLE "public"."Notifications" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON "public"."Notifications"
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admin (or system) can insert notifications
-- simplified: Authenticated users can insert (for admin interface usage)
CREATE POLICY "Authenticated users can insert notifications" 
ON "public"."Notifications"
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
