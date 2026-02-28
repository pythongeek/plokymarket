import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin Check
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single<{ is_super_admin: boolean }>();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
    }

    // Fetch Providers
    const { data: providers, error: providersError } = await supabase
      .from("ai_providers")
      .select("*")
      .order("provider_name");

    if (providersError) throw providersError;

    // Fetch Prompts 
    const { data: prompts, error: promptsError } = await supabase
      .from("ai_prompts")
      .select("*")
      .order("agent_name");

    if (promptsError) throw promptsError;

    // Fetch Old Settings (for backward compatibility if needed)
    const { data: oldSettings } = await supabase
      .from('admin_ai_settings')
      .select('*')
      .single();

    return NextResponse.json({
      success: true,
      providers: providers || [],
      prompts: prompts || [],
      settings: oldSettings || null
    });

  } catch (error: any) {
    console.error("[AI Config API GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin Check
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single<{ is_super_admin: boolean }>();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
    }

    const body = await req.json();
    const { type, data } = body;

    // Handle legacy settings updates
    if (!type && body.updated_by) {
      const { custom_instruction, target_region, default_categories, auto_generate_enabled, auto_generate_time, max_daily_topics, gemini_model, admin_id } = body;

      const { data: updatedOldSettings, error: oldSettingsError } = await supabase
        .from('admin_ai_settings')
        .update({
          custom_instruction,
          target_region,
          default_categories,
          auto_generate_enabled,
          auto_generate_time,
          max_daily_topics,
          gemini_model,
          updated_by: admin_id || user.id,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', 1)
        .select()
        .single();

      if (oldSettingsError) throw oldSettingsError;
      return NextResponse.json({ success: true, settings: updatedOldSettings, message: 'Legacy AI settings updated successfully' });
    }

    if (!type || !data) {
      return NextResponse.json({ error: "Bad Request: Missing type or data" }, { status: 400 });
    }

    if (type === "provider") {
      const { id, provider_name, model, base_url, temperature, max_tokens, is_active } = data;

      const updateData = {
        model,
        base_url,
        temperature,
        max_tokens,
        is_active,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      const { data: updatedProvider, error: updateError } = await supabase
        .from("ai_providers")
        .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, data: updatedProvider });

    } else if (type === "prompt") {
      const { id, system_prompt, is_active } = data;

      const updateData = {
        system_prompt,
        is_active,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      const { data: updatedPrompt, error: updateError } = await supabase
        .from("ai_prompts")
        .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, data: updatedPrompt });

    } else {
      return NextResponse.json({ error: "Bad Request: Invalid type" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[AI Config API POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
