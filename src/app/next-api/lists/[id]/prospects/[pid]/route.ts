import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_PIPELINE_STATUSES = [
  'belum_dihubungi',
  'dihubungi',
  'dibalas',
  'tertarik',
  'closed',
  'tidak_tertarik',
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { status, notes, pipeline_status } = body;

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  // pipeline_status: validasi enum lalu set timestamp
  if (pipeline_status !== undefined) {
    if (!VALID_PIPELINE_STATUSES.includes(pipeline_status)) {
      return NextResponse.json(
        { error: `pipeline_status tidak valid. Pilih salah satu: ${VALID_PIPELINE_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.pipeline_status = pipeline_status;
    updateData.pipeline_status_updated_at = new Date().toISOString();
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No data to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_prospects')
    .update(updateData)
    .eq('id', pid)
    .eq('list_id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
