import { View, Text , StyleSheet , ImageBackground} from 'react-native'
import React from 'react'
import logoImg from "@/assets/images/loading.png"

const explore = () => {
  return (
    <View style={styles.container}>
      <ImageBackground source={logoImg}
       style={styles.image}>
        <Text style={styles.text}>Student Assistant.</Text>
      </ImageBackground>
    </View>
  )
}


export default explore

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },

  image: {
    width: '100%',
    height: '100%',
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  text: {
    fontSize: 42,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0,0,0.5)',
  },
});