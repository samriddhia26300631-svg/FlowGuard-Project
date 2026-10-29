import { it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => {
  const query: any = {};
  for (const method of ['select','eq','insert','update']) query[method] = vi.fn(()=>query);
  query.maybeSingle = vi.fn(); query.single = vi.fn();
  const client = { from:vi.fn(()=>query), auth:{ getSession:vi.fn(), signInAnonymously:vi.fn(), getUser:vi.fn() } };
  return { query, client };
});
vi.mock('@supabase/supabase-js',()=>({ createClient:vi.fn(()=>mocks.client) }));
const empty = { clients:[],projects:[],tasks:[],changeRequests:[],team:[],commitments:[],dependencies:[],actionItems:[],handovers:[] };
beforeEach(()=>{
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL','https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','sb_publishable_test');
  mocks.client.auth.getSession.mockResolvedValue({ data:{session:null},error:null });
  mocks.client.auth.signInAnonymously.mockResolvedValue({error:null});
  mocks.client.auth.getUser.mockResolvedValue({data:{user:{id:'user-a'}},error:null});
});
it('authenticates anonymous demo user and scopes reads to that user',async()=>{
  mocks.query.maybeSingle.mockResolvedValue({data:null,error:null});
  const repo = await import('../src/data/cloudRepository');
  expect(await repo.connectCloud()).toEqual({owner:'user-a',record:null});
  expect(mocks.client.auth.signInAnonymously).toHaveBeenCalledOnce();
  expect(mocks.query.eq).toHaveBeenCalledWith('owner_id','user-a');
});
it('rejects stale revisions rather than overwriting cloud data',async()=>{
  mocks.query.maybeSingle.mockResolvedValue({data:null,error:null});
  const repo = await import('../src/data/cloudRepository');
  await expect(repo.saveCloud('user-a',4,empty)).rejects.toThrow('Cloud changed');
  expect(mocks.query.eq).toHaveBeenCalledWith('revision',4);
  expect(mocks.query.eq).toHaveBeenCalledWith('owner_id','user-a');
});
it('inserts empty workspaces and propagates database errors',async()=>{
  mocks.query.single.mockResolvedValueOnce({data:{revision:1},error:null}).mockResolvedValueOnce({data:null,error:new Error('RLS denied')});
  const repo = await import('../src/data/cloudRepository');
  expect(await repo.saveCloud('user-a',null,empty)).toBe(1);
  await expect(repo.saveCloud('user-a',null,empty)).rejects.toThrow('RLS denied');
});
it('rejects invalid remote collections and secret keys',async()=>{
  mocks.query.maybeSingle.mockResolvedValue({data:{data:{clients:null}},error:null});
  let repo = await import('../src/data/cloudRepository');
  await expect(repo.connectCloud()).rejects.toThrow('Invalid collection');
  vi.resetModules(); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','sb_secret_do_not_use');
  repo = await import('../src/data/cloudRepository');
  await expect(repo.connectCloud()).rejects.toThrow('never a secret');
});
