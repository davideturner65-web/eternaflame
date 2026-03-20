import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_globe_clusters", { grid_size: 5 });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
