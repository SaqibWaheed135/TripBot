import { Colors } from "@/constants/Colors";
import { Redirect } from "expo-router";
import { View } from "react-native";
import Login from "../components/Login";
import { auth } from './../configs/FirebaseConfig';
export default function Index() {
  const user = auth.currentUser;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE
      }}
    >
         {user ? <Redirect href="/mytrip" /> : <Login />}




    </View>
  );
}
