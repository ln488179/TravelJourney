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
SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

import greenCar from './assets/greenCar.png';
import redCar from './assets/redCar.png';

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

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, done, bmi, weight, height, date(itemDate) as itemDate from items where done = ? order by itemDate desc;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = "Travel History";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, bmi, weight, height, itemDate }) => (
        <Text key={id} style={styles.history}>{itemDate}:  {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
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
    </View>
  );
}

function New({ navigation }) {
  const [location, setLocation] = useState(0);
  const [travelDate, setTravelDate] = useState(0);
  const [planActivities, setPlanActivities] = useState(0);
  const [actualActivities, setActualActivities] = useState(0);
  const [afterVisited, setAfterVisited] = useState(0);

  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table items;"
      //);
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, bmi text, weight text, height text, itemDate real);"
      );
    });
  }, []);

  const add = (weight, height, bmi) => {
    // is weight empty?
    if (weight === null || weight === "") {
      return false;
    }

    // is weight empty?
    if (height === null || height === "") {
      return false;
    }

    bmi = ((weight / (height * height)) * 703).toFixed(1);

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (done, bmi, weight, height, itemDate) values (0, ?, ?, ?, julianday('now'))", [bmi, weight, height]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null
    );
  };

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
              style={styles.input}
              onChangeText={(planActivities) => setPlanActivities(planActivities)}
              placeholder="Plan Activities"
              value={planActivities}
            />
            <TextInput
              style={styles.input}
              onChangeText={(actualActivities) => setActualActivities(actualActivities)}
              placeholder="Actual Activities"
              value={actualActivities}
            />
            <TextInput
              style={styles.input}
              onChangeText={(afterVisited) => setAfterVisited(afterVisited)}
              placeholder="After Visited"
              value={afterVisited}
            />
            <TouchableOpacity 
              onPress={() => {
                /* 1. Navigate to the 'History' route with params */
                navigation.navigate('History', 
                {
                  location: location,
                  travelDate: travelDate,
                  planActivities: planActivities,
                  actualActivities: actualActivities,
                  afterVisited: afterVisited,
                });
              }}
            >
              <Text style={styles.button}>Save Journey</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
            />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function History({route, navigation}) {
  /* 2. Get the param */
  const { location, travelDate, planActivities, actualActivities, afterVisited } = route.params;

  return (
    <View style={styles.container3}>
      <Text style={styles.history}>
        Below are the past trips: {"\n"}
        * {location} - {travelDate} {"\n"}
        --- {planActivities} {"\n"}
        --- {actualActivities} {"\n"}
        --- {afterVisited} {"\n"}
        * Chicago - 2000{"\n"}
        * Denver - 2011{"\n"}
        * Houston - 2020{"\n"}
        * Rapid City - 2021{"\n"}{"\n"}{"\n"}
      </Text> 
      <Image source={greenCar} style={styles.imageGreen} />
    </View>
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
    justifyContent: 'center',
    alignItems: 'center'
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
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 24,
    marginBottom: 8,
  },
  history: {
    fontSize: 20,
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
