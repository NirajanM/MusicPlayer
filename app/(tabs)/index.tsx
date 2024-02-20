import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Progress from "react-native-progress";

interface MusicItemProps {
  item: any; // Replace 'any' with the actual type
  index: number;
  playing: number;
  playMusic: (uri: string) => void;
  pauseMusic: () => void;
  progressDuration: number;
  setPlaying: (index: number) => void;
}

class MusicItem extends React.PureComponent<MusicItemProps> {
  render() {
    const {
      item,
      index,
      playing,
      playMusic,
      pauseMusic,
      progressDuration,
      setPlaying,
    } = this.props;

    const secondsToHms = (d: number) => {
      d = Number(d);
      var h = Math.floor(d / 3600);
      var m = Math.floor((d % 3600) / 60);
      var s = Math.floor((d % 3600) % 60);

      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return hDisplay + mDisplay + sDisplay;
    };

    return (
      <View key={index}>
        <TouchableOpacity
          onPress={
            playing !== index
              ? () => {
                  playMusic(item.uri);
                  setPlaying(index);
                }
              : () => {
                  pauseMusic();
                  setPlaying(-1);
                }
          }
          style={styles.playButton}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={playing !== index ? "play" : "pause"}
              size={30}
              color="white"
            >
              <Text style={styles.fileName}>{item.filename}</Text>
            </Ionicons>
          </View>
          <View style={styles.row}>
            {playing === index && (
              <View>
                <Progress.Bar
                  progress={progressDuration / item.duration}
                  width={200}
                />
                <Text style={styles.fileName}>
                  {secondsToHms(Math.floor(progressDuration))} /{" "}
                  {secondsToHms(Math.floor(item.duration))}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function App() {
  const [musicFiles, setMusicFiles] = useState<any[]>([]); // Replace 'any' with the actual type
  const [playing, setPlaying] = useState<number>(-1);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [progressDuration, setProgressDuration] = useState<number>(0);

  const fetchMusicFiles = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 10000,
        sortBy: MediaLibrary.SortBy.default,
      });
      setMusicFiles(media.assets);
    } else {
      // Handle permission denial
    }
  }, []);

  const playMusic = useCallback(
    async (fileUri: string) => {
      const { sound } = await Audio.Sound.createAsync({
        uri: fileUri,
      });
      setSound(sound);
      await sound.playAsync();
    },
    [setSound]
  );

  const pauseMusic = useCallback(async () => {
    if (sound) {
      await sound.pauseAsync();
    }
  }, [sound]);

  useEffect(() => {
    if (!sound) {
      return;
    }

    sound.setOnPlaybackStatusUpdate(async (status: Audio.SoundStatus) => {
      if (status.isLoaded) {
        if (status.didJustFinish) {
          setPlaying(-1);
          await sound.unloadAsync();
          console.log("finished");
          setSound(null);
        } else {
          setProgressDuration(status.positionMillis / 1000);
        }
      }
    });
  }, [sound]);

  useEffect(() => {
    fetchMusicFiles();
  }, [fetchMusicFiles]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.list}>
        <FlatList
          data={musicFiles}
          renderItem={({ item, index }) => (
            <MusicItem
              item={item}
              index={index}
              playing={playing}
              playMusic={playMusic}
              pauseMusic={pauseMusic}
              progressDuration={progressDuration}
              setPlaying={setPlaying} // Pass setPlaying as a prop
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  container: {
    height: "100%",
    marginTop: 50,
  },
  heading: {
    color: "green",
    fontSize: 30,
    textAlign: "center",
    fontWeight: "bold",
  },
  list: {
    marginTop: 20,
    flex: 1,
    flexDirection: "column",
  },
  fileName: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  playButton: {
    borderBottomColor: "#222",
    borderBottomWidth: 2,
    padding: 10,
    paddingBottom: 20,
    margin: 10,
  },
});
