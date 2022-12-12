import { useState, useEffect } from "react";
import { 
  Image, Platform, ScrollView, StyleSheet, SafeAreaView, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

import greenCar from './assets/greenCar.png';
import redCar from './assets/redCar.png';
const waterUrl = 'https://www.chicago.gov/city/en/depts/dca/supp_info/city_gallery_in_thehistoricwatertower.html';

function handleButtonPress (url) {
  WebBrowser.openBrowserAsync(url);
}

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("travelDB.db");
  return db;
}

const db = openDatabase();

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, travelDate, location, planActivities, actualActivities from items order by id desc;`,
        [],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <ScrollView style={styles.sectionContainer}>
      {items.map(({ id, travelDate, location, planActivities, actualActivities}) => (
        <Text key={id} style={styles.history}>
          {travelDate} - {location}{"\n"} 
           * Plan: 
            {"\n"}{planActivities}{"\n"} 
           * Actual: 
            {"\n"}{actualActivities}{"\n"} 
        </Text>
      ))}
    </ScrollView>
  );
}

function Welcome() {
  return (
    <View style={styles.container1}>
      <Text style={styles.history}>
        Hello! Hello! {"\n"}
        Are you ready for the next journey? {"\n"}
        Where do you want to go now?{"\n"}{"\n"}{"\n"}
      </Text> 
      <Image source={redCar} style={styles.imageRed} />
      <Text>{"\n"}{"\n"}{"\n"}</Text>
      <TouchableOpacity onPress={()=> handleButtonPress(waterUrl)}>
        <Text style={styles.button}>Would love to visit next time</Text>
      </TouchableOpacity>
    </View>
  );
}

function New({ navigation }) {
  const [travelDate, setTravelDate] = useState(null);
  const [location, setLocation] = useState(null);
  const [planActivities, setPlanActivities] = useState(null);
  const [actualActivities, setActualActivities] = useState(null);

  return (
    <SafeAreaView style={styles.container2}>
      <Text style={styles.toolbar}>My New Journey</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <SafeAreaView style={styles.body}>
            <TextInput
              style={styles.input}
              onChangeText={(location) => setLocation(location)}
              placeholder="Location"              
              value={location}
            />
            <TextInput
              style={styles.input}
              onChangeText={(travelDate) => setTravelDate(travelDate)}
              placeholder="Travel Date"
              value={travelDate}
            />
            <TextInput
              style={styles.input2}
              onChangeText={(planActivities) => setPlanActivities(planActivities)}
              placeholder="Plan Activities"
              value={planActivities}
              multiline
            />
            <TextInput
              style={styles.input2}
              onChangeText={(actualActivities) => setActualActivities(actualActivities)}
              placeholder="Actual Activities"
              value={actualActivities}
              multiline
            />

            <TouchableOpacity 
              onPress={() => {
                /* 1. Navigate to the 'History' route with params */
                navigation.navigate('History', 
                {
                  location: location,
                  travelDate: travelDate,
                  planActivities: planActivities,
                  actualActivities: actualActivities
                });
              }}
            >
              <Text style={styles.button}>Save Journey</Text>
            </TouchableOpacity>
          </SafeAreaView>

        </>
      )}
    </SafeAreaView>
  );
}

function History({route, navigation}) {
  const { location, travelDate, planActivities, actualActivities } = route.params;
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table items;"
      //);
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, travelDate real, location text, planActivities text, actualActivities text);"
      );
    });

    add(travelDate, location, planActivities, actualActivities);

  }, []);

  const add = (travelDate, location, planActivities, actualActivities) => {
    // is travelDate empty?
    if (travelDate === null || travelDate === "") {
      return false;
    }

    // is location empty?
    if (location === null || location === "") {
      return false;
    }

    // is planActivities empty?
    if (planActivities === null || planActivities === "") {
      return false;
    }
    
    // is actualActivities empty?
    if (actualActivities === null || actualActivities === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (travelDate, location, planActivities, actualActivities) values (?, ?, ?, ?)", [travelDate, location, planActivities, actualActivities]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <SafeAreaView style={styles.container3}>
      <ScrollView style={styles.listArea}>
        <Items />
      </ScrollView>
      <Image source={greenCar} style={styles.imageGreen} />
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Welcome" component={Welcome}
        options={{
          headerStyle: { backgroundColor: '#30ACFF'},
          headerTintColor: '#fff',
      }} />
      <Tab.Screen name="New" component={New} 
        options={{
          headerStyle: { backgroundColor: '#30ACFF'},
          headerTintColor: '#fff',
      }} />
      <Tab.Screen name="History" component={History} 
        options={{
          headerStyle: { backgroundColor: '#30ACFF'},
          headerTintColor: '#fff',
      }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MyTabs />
    </NavigationContainer>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container2: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Constants.statusBarHeight,
  },
  container3: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Constants.statusBarHeight,
  },
  body: {
    flex: 1,
    padding: 5,
  },
  toolbar: {
    backgroundColor: '#FF407F',
    color: '#fff',
    textAlign: 'center',
    padding: 15,
    fontSize: 20,
    fontWeight: 'bold'
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: '#FFCBA8',
    borderRadius: 3,
    height: 40,
    padding: 10,
    marginBottom: 10,
    fontSize: 20,
  },
  input2: {
    backgroundColor: '#FFCBA8',
    borderRadius: 3,
    height: 120,
    padding: 10,
    marginBottom: 10,
    fontSize: 20,
  },
  button: {
    backgroundColor: '#30ACFF',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 30,
    fontSize: 20,
  },
  result: {
    paddingTop: 20,
    textAlign: 'center',
    fontSize: 28,
  },
  result2: {
    textAlign: 'center',
    fontSize: 28,
  },
  listArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 10,
    marginHorizontal: 10,
  },
  sectionHeading: {
    fontSize: 20,
    marginBottom: 5,
  },
  history: {
    fontSize: 15,
    marginBottom: 2,
  },
  imageRed: {
    width: 400, 
    height: 120
  },
  imageGreen: {
    width: 400, 
    height: 180
  },
});
