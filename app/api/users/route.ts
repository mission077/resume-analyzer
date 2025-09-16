import { getAuth, clerkClient } from "@clerk/nextjs/server"; // Clerk server helpers
import { createClient } from "@supabase/supabase-js"; // Supabase client
import { NextResponse, NextRequest } from "next/server"; // Next.js API types

// Initialize Supabase admin client with full access (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Get Clerk user ID from the request (if authenticated)
  const { userId } = getAuth(req);

  // If not authenticated, return 401 Unauthorized
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized User!" }, { status: 401 });
  }

  let email = null;
  try {
    // Clerk client is a function returning a promise in your version
    const client = await clerkClient();
    // Fetch full user info from Clerk
    const user = await client.users.getUser(userId);
    // Get the user's primary email address (if available)
    email = user.emailAddresses[0]?.emailAddress || null;
  } catch (err) {
    // If Clerk fetch fails, return 500 error
    return NextResponse.json(
      { error: "Failed to fetch user from Clerk." },
      { status: 500 }
    );
  }

  // Check if the user already exists in the Supabase 'users' table
  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  // If a database error occurs (other than "not found"), return 500 error
  if (selectError && selectError.code !== "PGRST116") {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  // If the user does not exist, insert them into the 'users' table
  if (!existingUser) {
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert([{ id: userId, email: email }])
      .select()
      .single();
    // If insert fails, return 500 error
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    // Return the newly created user with 201 Created
    return NextResponse.json({ user: newUser }, { status: 201 });
  }

  // If user already exists, return their data with 200 OK
  return NextResponse.json({ user: existingUser }, { status: 200 });
}
