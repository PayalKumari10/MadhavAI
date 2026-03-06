/**
 * Root Application Component
 * AI-Powered Farmer Decision Support Platform
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { logger } from './src/utils/logger';
import DashboardScreen from './src/screens/DashboardScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import MarketScreen from './src/screens/MarketScreen';
import SoilHealthScreen from './src/screens/SoilHealthScreen';
import SchemesScreen from './src/screens/SchemesScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import { DashboardService } from './src/services/dashboard/DashboardService';
import { DashboardAggregator } from './src/services/dashboard/DashboardAggregator';
import { PriorityEngine } from './src/services/dashboard/PriorityEngine';
import { weatherService } from './src/services/weather/WeatherService';
import { AlertScheduler } from './src/services/alert/AlertScheduler';
import { marketService } from './src/services/market/MarketService';
import { profileManager } from './src/services/profile/ProfileManager';
import { DatabaseService } from './src/services/storage/DatabaseService';
import { initializeTranslationServices } from './src/hooks/useTranslation';
import uiTranslations from './src/services/translation/translations/ui.translations';

// Initialize services
const db = new DatabaseService();
const alertScheduler = new AlertScheduler(db);
const aggregator = new DashboardAggregator(
  weatherService,
  alertScheduler,
  marketService,
  profileManager,
  db,
);
const priorityEngine = new PriorityEngine();
const dashboardService = new DashboardService(aggregator, priorityEngine);

// Initialize simple translation service for demo
const createSimpleTranslationService = () => {
  const translations = uiTranslations.en;
  return {
    translate: (key: string) => {
      return (translations as any)[key] || key.split('.').pop() || key;
    },
    initialize: async () => {},
    setLanguage: async () => {},
  };
};

const translationService = createSimpleTranslationService() as any;
const languagePreferenceManager = {
  getLanguagePreference: async () => 'en' as any,
  setRegistrationLanguage: async () => {},
} as any;

// Initialize translation hook
initializeTranslationServices(translationService, languagePreferenceManager);

// Mock user ID for demo purposes
const DEMO_USER_ID = 'demo-user-001';

// Create navigation stack
const Stack = createNativeStackNavigator();

function DashboardWrapper({ navigation }: any) {
  return (
    <DashboardScreen
      userId={DEMO_USER_ID}
      dashboardService={dashboardService}
      navigation={navigation}
    />
  );
}

function App(): React.JSX.Element {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('Application started');
        
        // Check if profile exists, if not create a demo profile
        const hasProfile = await profileManager.hasProfile();
        
        if (!hasProfile) {
          logger.info('Creating demo profile...');
          await profileManager.createProfile({
            mobileNumber: '+919876543210',
            name: 'Demo Farmer',
            location: {
              state: 'Maharashtra',
              district: 'Pune',
              village: 'Demo Village',
              pincode: '411001',
              coordinates: {
                latitude: 18.5204,
                longitude: 73.8567,
              },
            },
            farmSize: 5.0,
            primaryCrops: ['wheat', 'rice', 'cotton'],
            soilType: 'loamy',
            languagePreference: 'en',
          });
          logger.info('Demo profile created successfully');
        }
        
        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize app', error);
        setIsInitialized(true); // Still show UI even if initialization fails
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardWrapper}
            options={{ title: 'MADHAV AI Dashboard' }}
          />
          <Stack.Screen 
            name="Weather" 
            component={WeatherScreen}
            options={{ title: 'Weather Forecast' }}
          />
          <Stack.Screen 
            name="Market" 
            component={MarketScreen}
            options={{ title: 'Market Prices' }}
          />
          <Stack.Screen 
            name="Schemes" 
            component={SchemesScreen}
            options={{ title: 'Government Schemes' }}
          />
          <Stack.Screen 
            name="Training" 
            component={TrainingScreen}
            options={{ title: 'Training & Learning' }}
          />
          <Stack.Screen 
            name="Recommendations" 
            component={RecommendationsScreen}
            options={{ title: 'Recommendations' }}
          />
          <Stack.Screen 
            name="SoilHealth" 
            component={SoilHealthScreen}
            options={{ title: 'Soil Health' }}
          />
          <Stack.Screen 
            name="Alerts" 
            component={AlertsScreen}
            options={{ title: 'Alerts & Reminders' }}
          />
          <Stack.Screen 
            name="CropPlanner" 
            component={PlaceholderScreen}
            initialParams={{ title: 'Crop Planner' }}
            options={{ title: 'Crop Planner' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
