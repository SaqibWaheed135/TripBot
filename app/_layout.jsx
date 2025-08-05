import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useState } from "react";
import { CreateTripContext } from '../context/CreateTripContext';

export default function RootLayout() {
  useFonts({
    'poppins': require('../assets/fonts/Poppins-Regular.ttf'),

    'poppins-semiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),

    'poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),

    'poppins-extraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),

    'poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),

     'poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),

  })

  const [tripData,setTripData]=useState([]);
  return(
    <CreateTripContext.Provider value={{tripData,setTripData}}>
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="(tabs)"/>
    </Stack>
    </CreateTripContext.Provider>
  )
}
