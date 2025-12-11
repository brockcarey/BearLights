import { supabase } from "../../apps/web/lib/supabaseClient"; // temp import
import { Player } from "../../types";

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('jersey_number', { ascending: true });

  if (error) throw error;
  return data as Player[];
}
