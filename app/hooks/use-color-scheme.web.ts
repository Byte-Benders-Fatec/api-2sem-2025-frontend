// hooks/use-color-scheme.ts
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Pref = 'light' | 'dark' | 'system';
const STORAGE_KEY = '@theme_pref';

const listeners = new Set<(pref: Pref) => void>();

function notify(pref: Pref) {
  listeners.forEach((fn) => {
    try { fn(pref); } catch { /* ignore */ }
  });
}

function effectiveFrom(pref: Pref): 'light' | 'dark' {
  if (pref === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return pref;
}

/** Hook principal: retorna 'light' | 'dark' (efetivo) */
export default function useColorScheme(): 'light' | 'dark' {
  const [pref, setPref] = useState<Pref>('system');
  const [effective, setEffective] = useState<'light' | 'dark'>(() => effectiveFrom('system'));

  // carrega preferência do storage
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!mounted) return;
        if (v === 'light' || v === 'dark' || v === 'system') {
          setPref(v);
          setEffective(effectiveFrom(v));
        } else {
          setPref('system');
          setEffective(effectiveFrom('system'));
        }
      })
      .catch(() => {
        if (mounted) {
          setPref('system');
          setEffective(effectiveFrom('system'));
        }
      });
    return () => { mounted = false; };
  }, []);

  // escuta mudanças do sistema (Appearance) — atualiza apenas se pref === 'system'
  useEffect(() => {
    const handler = ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      if (pref === 'system') {
        setEffective(colorScheme === 'dark' ? 'dark' : 'light');
      }
    };

    const sub = Appearance.addChangeListener(handler);
    
    return () => {
      try {
        // @ts-ignore
        if (sub && typeof sub.remove === 'function') sub.remove();
        // se sub for uma função, chamar sub()
        else if (typeof (sub as any) === 'function') (sub as any)();
      } catch {
        // ignore
      }
    };
  }, [pref]);

  // escuta notificações internas (quando o setter global é usado)
  useEffect(() => {
    const fn = (p: Pref) => {
      setPref(p);
      setEffective(effectiveFrom(p));
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return effective;
}

/** Hook auxiliar para ler/alterar preferência (light|dark|system) */
export function useThemePreference(): [Pref, (p: Pref) => Promise<void>] {
  const [pref, setPrefState] = useState<Pref>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!mounted) return;
        if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
        else setPrefState('system');
      })
      .catch(() => { if (mounted) setPrefState('system'); });
    return () => { mounted = false; };
  }, []);

  const setPref = async (p: Pref) => {
    await AsyncStorage.setItem(STORAGE_KEY, p);
    setPrefState(p);
    notify(p);
  };

  return [pref, setPref];
}

/** utilitários para listeners externos */
export function addThemeListener(fn: (p: Pref) => void) { listeners.add(fn); }
export function removeThemeListener(fn: (p: Pref) => void) { listeners.delete(fn); }
