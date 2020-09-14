// @refresh reset
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Settings,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as firebase from "firebase";
import "firebase/firestore";
import AsyncStorage, {
  useAsyncStorage,
} from "@react-native-community/async-storage";
import { GiftedChat } from "react-native-gifted-chat";

// ======================================= firebase setting ========================

const firebaseConfig = {
  apiKey: "AIzaSyCxapwREmUWVFhiAuy0aZtjCJrv6vGu7b4",
  authDomain: "chatapp-on-reactnative.firebaseapp.com",
  databaseURL: "https://chatapp-on-reactnative.firebaseio.com",
  projectId: "chatapp-on-reactnative",
  storageBucket: "chatapp-on-reactnative.appspot.com",
  messagingSenderId: "840191000492",
  appId: "1:840191000492:web:a159d67357e7a062b64409",
  measurementId: "G-RD49LHDC9M",
};

// firebaseを使って取り出された値が一つもない時に if の条件式を入れいる（あった方が良いらしい）
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const chatsCollection = db.collection("chats");

// =================================================================================

export default function App() {
  // =================states============
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([]);

  // ===============functions===========
  useEffect(() => {
    readUser();
    console.log(user);

    const unsbscribe = chatsCollection.onSnapshot((querSnapshot) => {
      const allmessages = querSnapshot
        .docChanges()
        .filter(({ type }) => type === "added")
        .map(({ doc }) => {
          const allData = doc.data();
          return {
            ...allData,
            createdAt: allData.createdAt.toDate(),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      appendMessage(allmessages);
      // return console.log(allmessages);
    });
    return () => unsbscribe();
  }, []);

  // ~~~~~~~~~~~~~~
  // ユーザー情報があるかどうか
  const readUser = async () => {
    const _user = await AsyncStorage.getItem("user");

    if (_user) {
      setUser(JSON.parse(_user));
    }
  };
  // ~~~~~~~~~~~~~~~
  // ユーザー情報を登録
  const handleSignUp = async () => {
    const _id = Math.random().toString(20).substring(10);
    const user = { _id: _id, name: name };

    await AsyncStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  // ~~~~~~~~~~~~~~~~
  // メッセージをデータベースに追加
  // ＊引数を忘れずに
  // ＊ await Promise.all(~) = 全てのリクエストの結果を待てという命令
  const handleSend = async (messages) => {
    const _message = messages.map((message) => {
      chatsCollection.add(message);
    });
    await Promise.all(_message);
  };

  // ~~~~~~~~~~~~~~~~~
  // 今までのメッセージを setMessages をして追加している
  // ＊ useCallback　＝　同じ値を返すときは、この関数は動かずに、前の値を与える。しかし、値に変更がある場合は、この関数が発動され、新たな値を生成する
  // ＊ allmessages =　unsbscribe から送られてきた allmessages を引数として受ける
  // ＊ nowMessages　＝　一つ一つのメッセージ
  // ＊ [messages]　＝　messages に変化が有れば関数が実行されるよ（人の気持ちと同じ）

  const appendMessage = useCallback(
    (allmessages) => {
      setMessages((nowMessages) => GiftedChat.append(nowMessages, allmessages));
    },
    [messages]
  );

  // ~~~~~~~~~ unsbscribe解説 ~~~~~~~~
  // appendMessage(allmessages)　へ全てのメッセージと時間を送る
  // ＊　allData = doc 内の全データオブジェクト
  // ＊ return = allData と　時間を時間プロパティに入れて完成
  // ＊　オブジェクトのフォーマットは、 GiftedChatによって決められている
  // ＊ const の定義自体を useEffect 内でやらなくてはいけない

  // ＊　createdAt プロパティを作る理由　＝　デフォルトの場合、以下の様になる
  // "createdAt": t {
  //   "nanoseconds": 827000000,
  //   "seconds": 1600064281,
  // },
  // なので、createdAt: allData.createdAt.toDate() を実行し以下の様に変換し、 GiftedChat 読み取れる様にする必要がある
  // "createdAt": 2020-09-14T06:18:01.827Z

  // ＊ sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) は、一番下に一番最新の投稿を表示する

  // ==============VIEW================
  if (!user) {
    return (
      <View style={styles.container}>
        <TextInput
          placeholder={"your name"}
          value={name}
          onChangeText={setName}
        />
        <Button title={"sign up"} onPress={handleSignUp}></Button>
      </View>
    );
  }

  return <GiftedChat messages={messages} user={user} onSend={handleSend} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    borderWidth: 2,
    borderRadius: 30,
    padding: 20,
  },
  input: {
    borderBottomWidth: 2,
  },
});
