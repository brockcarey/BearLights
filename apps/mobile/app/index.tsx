import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { useEffect, useState } from "react";
import { View, Text, Image, FlatList, Pressable, Modal, Button, ScrollView } from "react-native";
import { supabase } from "../lib/supabaseClient";
import { Player } from "../../../packages/types";
import { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'jersey' | 'name' | 'position'>('jersey');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "BearLights" });
  }, [navigation]);

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

        playersWithUrls.sort((a,b) => (a.jersey_number ?? 0) - (b.jersey_number ?? 0));
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
  const getSortedPlayers = () => {
    const arr = [...players];
    if (sortBy === 'name') {
      arr.sort((a, b) => String(a.full_name ?? '').localeCompare(String(b.full_name ?? '')));
    } else if (sortBy === 'position') {
      arr.sort((a, b) => String(a.position ?? '').localeCompare(String(b.position ?? '')));
    } else {
      arr.sort((a, b) => (a.jersey_number ?? 0) - (b.jersey_number ?? 0));
    }
    return arr;
  };

  return (
    <>
      <View style={{ paddingTop: 12, paddingBottom: 8, alignItems: 'center' }}>
        <Pressable onPress={() => setSortModalVisible(true)} style={{ padding: 8, backgroundColor: '#bbdbbdff', borderRadius: 8 }}>
          <Text>Sort By: {sortBy === 'jersey' ? 'Jersey Number' : sortBy === 'name' ? 'Name' : 'Position'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={getSortedPlayers()}
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
            <Pressable
              onPress={() => {
                setSelectedPlayer(p);
                setModalVisible(true);
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginVertical: 8 })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: 128, height: 128, borderRadius: 32, marginRight: 12, backgroundColor: "#eee" }}
                    resizeMode="cover"
                    onError={(e) => console.warn("Image load error:", uri, e.nativeEvent)}
                  />
                ) : (
                  <View style={{ width: 128, height: 128, borderRadius: 32, marginRight: 12, backgroundColor: "#ddd" }} />
                )}
                <Text>#{p.jersey_number} {p.full_name} - {p.position}</Text>
              </View>
            </Pressable>
          );
      }}
      />

      <Modal
        visible={sortModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8 }}>
            <Pressable onPress={() => { setSortBy('jersey'); setSortModalVisible(false); }} style={{ padding: 12 }}>
              <Text style={{ textAlign: 'center' }}>Jersey Number</Text>
            </Pressable>
            <Pressable onPress={() => { setSortBy('name'); setSortModalVisible(false); }} style={{ padding: 12 }}>
              <Text style={{ textAlign: 'center' }}>Name</Text>
            </Pressable>
            <Pressable onPress={() => { setSortBy('position'); setSortModalVisible(false); }} style={{ padding: 12 }}>
              <Text style={{ textAlign: 'center' }}>Position</Text>
            </Pressable>
            <Pressable onPress={() => setSortModalVisible(false)} style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ color: '#007aff', textAlign: 'center' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedPlayer(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, maxHeight: "80%" }}>
            <ScrollView contentContainerStyle={{ paddingTop: 12 }}>
              {selectedPlayer ? (
                <>
                  {((selectedPlayer as any)?.url) ? (
                    <Image source={{ uri: String((selectedPlayer as any).url) }} style={{ width: "100%", height: 250, borderRadius: 8, marginBottom: 12 }} resizeMode="cover" />
                  ) : null}
                  <Text style={{ fontWeight: "600", fontSize: 18, marginBottom: 6 }}>{selectedPlayer.full_name}</Text>
                  <Text>#{selectedPlayer.jersey_number} • {selectedPlayer.position}</Text>
                  {(selectedPlayer as any).team && <Text>Team: {(selectedPlayer as any).team}</Text>}
                  {(selectedPlayer as any).bio && <Text style={{ marginTop: 8 }}>{(selectedPlayer as any).bio}</Text>}
                  {/* fallback: show raw JSON for additional fields */}
                  {/* <Text style={{ marginTop: 12, color: "#666", fontSize: 12 }}>{JSON.stringify(selectedPlayer, null, 2)}</Text> */}
                </>
              ) : (
                <Text>No player selected</Text>
              )}
            </ScrollView>
            <Button title="Close" onPress={() => { setModalVisible(false); setSelectedPlayer(null); }} />
          </View>
        </View>
      </Modal>
    </>
  );
}