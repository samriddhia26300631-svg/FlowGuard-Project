import { useEffect, useRef, useState } from 'react';
import { cloudConfigured, connectCloud, saveCloud } from '../data/cloudRepository';
import { exportWorkspace, validateWorkspace, type Workspace } from '../data/workspace';

export function useCloudPersistence(workspace: Workspace, apply: (value: Workspace) => void) {
  const latest = useRef(workspace); latest.current = workspace;
  const applyRef = useRef(apply); applyRef.current = apply;
  const cloud = useRef<{ owner: string; revision: number | null } | null>(null);
  const saved = useRef('');
  const saving = useRef(false);
  const paused = useRef(false);
  const [status, setStatus] = useState('Local demo — saved in this browser');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');

  async function connect() {
    if (busy || cloud.current) return;
    setBusy(true); setError('');
    try {
      // Retain a full backup before any cloud read can replace local state.
      localStorage.setItem(`flowguard_backup_${Date.now()}`, JSON.stringify(latest.current));
      const { owner, record } = await connectCloud();
      if (record) {
        saved.current = JSON.stringify(record.data);
        applyRef.current(record.data);
        cloud.current = { owner, revision: record.revision };
        setStatus('Cloud loaded — saved to PostgreSQL');
      } else {
        const snapshot = latest.current;
        const revision = await saveCloud(owner, null, snapshot);
        saved.current = JSON.stringify(snapshot);
        cloud.current = { owner, revision };
        setStatus('Browser workspace migrated — saved to PostgreSQL');
      }
      paused.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('Cloud connection failed — local demo remains available');
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!cloud.current || paused.current || JSON.stringify(workspace) === saved.current) return;
    setStatus('Changes pending — saved locally');
    const timer = setTimeout(async () => {
      if (saving.current || !cloud.current || paused.current) return;
      saving.current = true;
      const snapshot = latest.current;
      setStatus('Saving to PostgreSQL…');
      try {
        cloud.current.revision = await saveCloud(cloud.current.owner, cloud.current.revision, snapshot);
        saved.current = JSON.stringify(snapshot);
        setStatus('Saved to PostgreSQL'); setError('');
      } catch (e) {
        paused.current = true;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('Cloud save paused — changes remain local; export a backup');
      } finally {
        saving.current = false;
        setTick(t => t + 1); // Drain newer edits serially; never race two writes.
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [workspace, tick, busy]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (cloud.current && JSON.stringify(latest.current) !== saved.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  async function importBackup(file: File) {
    if (cloud.current || busy) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      validateWorkspace(data);
      localStorage.setItem(`flowguard_backup_${Date.now()}`, JSON.stringify(latest.current));
      applyRef.current(data);
      setError(''); setStatus('Backup restored — local demo');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  return { importBackup, cloudConfigured, status, error, busy, connected: Boolean(cloud.current), connect,
    retry: () => { paused.current = false; setTick(t => t + 1); },
    exportBackup: () => exportWorkspace(latest.current) };
}
