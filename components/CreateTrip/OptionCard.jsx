// OptionCard.js
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

const OptionCard = ({ option, selectedOption }) => {
  const isSelected = selectedOption?.id === option?.id;

  // Icon mapping for different traveler types
  const getIcon = (title) => {
    switch (title?.toLowerCase()) {
      case 'just me':
        return 'person';
      case 'a couple':
        return 'heart';
      case 'family':
        return 'home';
      case 'friends':
        return 'people';
      default:
        return 'people-outline';
    }
  };

  return (
    <View style={[
      styles.container,
      isSelected && styles.selectedContainer
    ]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconBackground,
            isSelected && styles.selectedIconBackground
          ]}>
            <Ionicons 
              name={getIcon(option?.title)} 
              size={28} 
              color={isSelected ? 'white' : '#667eea'} 
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            isSelected && styles.selectedTitle
          ]}>
            {option?.title}
          </Text>
          <Text style={[
            styles.description,
            isSelected && styles.selectedDescription
          ]}>
            {option?.desc}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#10ac84" />
          </View>
        )}
      </View>

      {isSelected && <View style={styles.selectedBorder} />}
    </View>
  )
}

export default OptionCard

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  selectedContainer: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedIconBackground: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    color: '#333',
    fontFamily: 'poppins-Bold',
    marginBottom: 6,
  },
  selectedTitle: {
    color: '#667eea',
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'poppins',
    lineHeight: 22,
  },
  selectedDescription: {
    color: '#555',
  },
  checkmark: {
    marginLeft: 10,
  },
  selectedBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#667eea',
  },
});