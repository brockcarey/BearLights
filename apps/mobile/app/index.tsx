// ...existing code...
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { useEffect, useState } from "react";
import { View, Text, Image, FlatList } from "react-native";
import { supabase } from "../lib/supabaseClient";
import { Player } from "../../../packages/types";
// ...existing code...

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from("players").select("*");
        // console.log("supabase raw data:", JSON.stringify(data, null, 2), "error:", error);
        if (error) throw error;

        // Normalize common image column names coming from DB
        const playersWithUrls = (data ?? []).map((row: any) => {
          // console.log("raw player row:", row);
          const url =
            row.url ??
            row.image_url ??
            row.photo_url ??
            row.avatar_url ??
            row.image ??
            row.photo ??
            row.avatar ??
            null;
          return { ...row, url };
        });

        setPlayers(playersWithUrls as Player[] ?? []);
      } catch (e: any) {
        console.error("load players error:", e);
        setError(String(e.message ?? e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <View style={{ marginTop: 50, padding: 20 }}><Text>Loading…</Text></View>;
  if (error) return <View style={{ marginTop: 50, padding: 20 }}><Text>Error: {error}</Text></View>;

  return (
    <FlatList
      data={players}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
      showsVerticalScrollIndicator
      ListEmptyComponent={<Text>No players found</Text>}
      renderItem={({ item: p }) => {
        // DEBUG: inspect raw value coming from Supabase
        // console.log("player raw url:", (p as any).url, "typeof:", typeof (p as any).url);
        // Normalize to a usable string for Image.source.uri
        const raw = (p as any).url;
        let uri: string | null = null;

        if (raw == null) {
          uri = null;
        } else if (typeof raw === "string") {
          uri = raw.trim();
          // strip extra surrounding quotes if present: "\"https://...\"" -> "https://..."
          if (uri.length >= 2 && uri[0] === '"' && uri[uri.length - 1] === '"') {
            uri = uri.slice(1, -1);
          }
        } else if (typeof raw === "object") {
          // handle common cases: { url: "..." } or {fullUrl: "..."}
          uri = (raw.url ?? raw.fullUrl ?? raw.uri ?? null) as string | null;
          if (!uri) {
            // fallback to stringify so you can see what's inside the object in logs
            uri = JSON.stringify(raw);
          }
        } else {
          uri = String(raw);
        }

        // console.log("player normalized uri:", uri);

        return (
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
            {uri ? (
              <Image
                source={{ uri }}
                style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12, backgroundColor: "#eee" }}
                resizeMode="cover"
                // onLoad={() => console.log("Image loaded:", uri)}
                onError={(e) => console.warn("Image load error:", uri, e.nativeEvent)}
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12, backgroundColor: "#ddd" }} />
            )}
            <Text>#{p.jersey_number} {p.full_name} - {p.position}</Text>
          </View>
        );
      }}
    />
  );
}
// ...existing code...