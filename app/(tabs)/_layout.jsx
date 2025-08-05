import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Colors } from './../../constants/Colors';

const TabLayout = () => {
  return (
    <Tabs screenOptions={{headerShown:false}}>
        <Tabs.Screen name='mytrip' options={{
          tabBarActiveTintColor:Colors.PRIMARY,
          tabBarLabel:'My Trip',
          tabBarIcon:({color})=><Entypo name="location" size={24} color={color} />
        }
          
        }/>
         <Tabs.Screen name='discover'
         options={{
          tabBarActiveTintColor:Colors.PRIMARY,
          tabBarLabel:'Discover',
          tabBarIcon:({color})=><Ionicons name="globe-sharp" size={24} color={color}/>
        }
          
        }/>
          <Tabs.Screen name='profile'
          options={{
          tabBarActiveTintColor:Colors.PRIMARY,
          tabBarLabel:'Profile',
          tabBarIcon:({color})=><Ionicons name="people-circle" size={24} color={color} />
        }
          
        }/>
    </Tabs>
  )
}

export default TabLayout

const styles = StyleSheet.create({})