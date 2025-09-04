import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized User!" });
  }

  const email = req.headers["x-clerk-email"] || null;

  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    return res.status(500).json({ error: selectError.message });
  }

  if (!existingUser) {
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert([{ id: userId, email: email }])
      .select()
      .single();
    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
    return res.status(201).json({ user: newUser });
  }

  return res.status(200).json({ user: existingUser });
}
