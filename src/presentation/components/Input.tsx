import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface InputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({ label, icon, secureTextEntry, containerStyle, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.gray}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={isFocused ? colors.primary : colors.textSecondary}
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  labelFocused: {
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    borderRadius: 14,
    backgroundColor: '#F8F8F8',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fff',
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  icon: {
    marginLeft: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  rightIcon: {
    padding: 10,
    marginRight: 8,
  },
});

export default Input;
