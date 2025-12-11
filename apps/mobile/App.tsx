import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "./lib/supabaseClient";
import { Player } from "../../../packages/types";

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("players")
        .select("*");

      if (error) console.error(error);
      else setPlayers(data as Player[]);
    }
    load();
  }, []);

  return (
    <View style={{ marginTop: 50, padding: 20 }}>
      {players.map(p => (
        <Text key={p.id}>
          {p.full_name} — #{p.jersey_number}
        </Text>
      ))}
    </View>
  );
}
