import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  newEmail: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { newEmail, password }: RequestBody = await req.json();

    if (!newEmail || !password) {
      return new Response(
        JSON.stringify({ error: "New email and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Invalid password. Please verify your current password." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email === newEmail);

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "This email address is already in use." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );

    if (updateError) {
      console.error("Error updating email in auth:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update email: " + updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ email: newEmail })
      .eq("auth_user_id", user.id);

    if (profileError) {
      console.error("Error updating email in profile:", profileError);
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id, role_id")
      .eq("auth_user_id", user.id)
      .single();

    if (profile) {
      if (profile.role_id === "teacher" || profile.role_id === "librarian" || profile.role_id === "admin") {
        await supabaseClient
          .from("staff")
          .update({ email: newEmail })
          .eq("profile_id", profile.id);
      } else if (profile.role_id === "student") {
        await supabaseClient
          .from("students")
          .update({ email: newEmail })
          .eq("profile_id", profile.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email updated successfully. Please sign in with your new email."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in change-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});