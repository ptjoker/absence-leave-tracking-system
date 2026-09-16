import { View, Text , StyleSheet} from 'react-native'
import React from 'react'

const app = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to our Mobile App.</Text>
    </View>
  )
}

export default app

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  text: {
    fontSize: 42,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});