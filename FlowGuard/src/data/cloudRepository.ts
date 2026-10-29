import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateWorkspace, type Workspace } from './workspace';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = Boolean(url && key);
// Only a public publishable/legacy anon key belongs in browser environment variables.
type Database = {
  public: {
    Tables: {
      flowguard_workspaces: {
        Row: { owner_id: string; revision: number; data: Workspace; updated_at: string };
        Insert: { owner_id: string; revision: number; data: Workspace; updated_at?: string };
        Update: { data: Workspace; revision: number; updated_at: string };
        Relationships: [];
      };
    };
    Views: {}; Functions: {};
  };
};
let client: SupabaseClient<Database> | null = null;
function getClient() {
  if (!cloudConfigured) throw new Error('Set the Supabase URL and publishable key, then restart Vite.');
  if (key.startsWith('sb_secret_')) throw new Error('Use a publishable key, never a secret key.');
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role') throw new Error('Service-role keys must never be used in this app.');
    } catch (e) { if (e instanceof Error && e.message.includes('Service-role')) throw e; }
  }
  client ??= createClient<Database>(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) }
  });
  return client;
}
export interface CloudRecord { owner_id: string; revision: number; data: Workspace }

export async function connectCloud(): Promise<{ owner: string; record: CloudRecord | null }> {
  const client = getClient();
  const session = await client.auth.getSession();
  if (session.error) throw session.error;
  if (!session.data.session) {
    const signed = await client.auth.signInAnonymously();
    if (signed.error) throw signed.error;
  }
  const user = await client.auth.getUser();
  if (user.error || !user.data.user) throw user.error || new Error('Authentication required');
  const owner = user.data.user.id;
  const result = await client.from('flowguard_workspaces').select('owner_id,revision,data').eq('owner_id', owner).maybeSingle();
  if (result.error) throw result.error;
  if (result.data) validateWorkspace(result.data.data);
  return { owner, record: result.data as CloudRecord | null };
}

export async function saveCloud(owner: string, revision: number | null, data: Workspace): Promise<number> {
  const client = getClient();
  validateWorkspace(data);
  const result = revision === null
    ? await client.from('flowguard_workspaces').insert({ owner_id: owner, revision: 1, data }).select('revision').single()
    : await client.from('flowguard_workspaces').update({ data, revision: revision + 1, updated_at: new Date().toISOString() })
      .eq('owner_id', owner).eq('revision', revision).select('revision').maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error('Cloud changed in another tab. Export this workspace, then reload and reconnect. No cloud data was overwritten.');
  return result.data.revision;
}
