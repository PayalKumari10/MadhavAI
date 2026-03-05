# Explainability Engine

The Explainability Engine generates clear, simple explanations for all recommendations in the Farmer Decision Support Platform.

## Features

- **Clear Reasoning**: Generates explanations in simple language without technical jargon
- **Factor Identification**: Identifies and analyzes factors affecting recommendations
- **Impact Analysis**: Categorizes factors as positive, negative, or neutral
- **Confidence Scoring**: Calculates confidence based on data completeness and factor alignment
- **Multi-Type Support**: Works with crop, fertilizer, seed, soil, and weather recommendations

## Requirements Addressed

- **3.5**: Fertilizer recommendation explainability
- **4.5**: Seed recommendation explainability
- **6.7**: Weather advice explainability
- **7.5**: Crop recommendation explainability
- **10.5**: Soil improvement explainability
- **16.5**: AI recommendation explainability

## Usage

### Basic Usage

```typescript
import { explainabilityEngine } from './services/recommendation';
import { farmingContextBuilder } from './services/recommendation';

// Build farming context
const context = await farmingContextBuilder.buildContext(userProfile);

// Generate crop explanation
const cropExplanation = explainabilityEngine.generateCropExplanation(
  'Rice',
  {
    suitability: 85,
    profitability: 75,
    risk: 30,
    overall: 80,
  },
  context
);

console.log(cropExplanation.summary);
// Output: "Rice is a good choice for your farm based on current conditions."

console.log(cropExplanation.reasoning);
// Output: "We recommend Rice for your farm. This is good because current kharif season 
// is suitable for this crop and your soil is in good condition for this crop. 
// Follow the step-by-step plan for best results."

console.log(cropExplanation.confidence);
// Output: 85

console.log(cropExplanation.factors);
// Output: [
//   {
//     name: 'Season',
//     impact: 'positive',
//     weight: 0.25,
//     description: 'Current kharif season is suitable for this crop'
//   },
//   ...
// ]
```

### Fertilizer Explanation

```typescript
const fertilizerExplanation = explainabilityEngine.generateFertilizerExplanation(
  'Urea',
  'Nitrogen',
  context
);

console.log(fertilizerExplanation.reasoning);
// Output: "We recommend Urea for your farm. Your soil has low nitrogen (250 kg/ha). 
// Plants need nitrogen for healthy leaf growth. Apply fertilizer at the right time 
// for best results."
```

### Seed Explanation

```typescript
const seedExplanation = explainabilityEngine.generateSeedExplanation(
  'BPT 5204',
  'Rice',
  context
);

console.log(seedExplanation.summary);
// Output: "BPT 5204 (Rice) is a good choice for your farm based on current conditions."
```

### Soil Improvement Explanation

```typescript
const soilExplanation = explainabilityEngine.generateSoilExplanation(
  'Lime Application',
  context
);

console.log(soilExplanation.factors);
// Shows factors like soil pH, nutrient levels, organic matter
```

### Weather Advice Explanation

```typescript
const weatherExplanation = explainabilityEngine.generateWeatherExplanation(
  'Delay field work',
  context
);

console.log(weatherExplanation.reasoning);
// Output: "We recommend Delay field work for your farm. Please note: Heavy rain (75mm) 
// expected. Delay field work. Check weather updates daily and plan your work accordingly."
```

## Explanation Structure

Each explanation includes:

### Summary
A concise one-sentence summary of the recommendation.

```typescript
{
  summary: "Rice is a good choice for your farm based on current conditions."
}
```

### Factors
An array of factors affecting the recommendation, sorted by importance (weight).

```typescript
{
  factors: [
    {
      name: "Season",
      impact: "positive" | "negative" | "neutral",
      weight: 0.25, // 0-1 scale
      description: "Current kharif season is suitable for this crop"
    },
    ...
  ]
}
```

### Confidence
A confidence score (0-100) based on data completeness and factor alignment.

```typescript
{
  confidence: 85 // 0-100
}
```

### Reasoning
A detailed explanation in simple, farmer-friendly language.

```typescript
{
  reasoning: "We recommend Rice for your farm. This is good because current kharif season is suitable for this crop and your soil is in good condition for this crop. Follow the step-by-step plan for best results."
}
```

## Design Principles

### 1. Simple Language
- Avoids technical jargon (NPK, quintals, hectare, EC, ppm)
- Uses farmer-friendly terms
- Explains concepts in simple terms (e.g., "Plants need nitrogen for healthy leaf growth")

### 2. Actionable Guidance
- Provides specific actions farmers can take
- Includes timing and method information
- Offers practical advice

### 3. Transparent Reasoning
- Shows all factors considered
- Explains impact of each factor
- Provides confidence level

### 4. Context-Aware
- Adapts to available data
- Handles missing data gracefully
- Adjusts confidence based on data completeness

## Factor Types

### Crop Factors
- Season suitability
- Soil condition
- Weather conditions
- Market prices
- Farm size

### Fertilizer Factors
- Nitrogen level
- Phosphorus level
- Potassium level
- Organic matter
- Soil health

### Seed Factors
- Planting season
- Soil match
- Disease protection
- Expected yield

### Soil Factors
- Soil pH (acidity/alkalinity)
- Nutrient levels
- Organic matter content

### Weather Factors
- Rainfall
- Temperature
- Humidity
- Wind speed

## Confidence Calculation

Confidence is calculated based on:

1. **Data Completeness** (from FarmingContext)
   - User profile data
   - Soil health data
   - Weather forecast data
   - Market price data

2. **Factor Alignment**
   - If factors are mostly positive or mostly negative, confidence increases
   - Mixed factors reduce confidence slightly

3. **Range**: 0-100
   - 80-100: High confidence
   - 60-79: Moderate confidence
   - 0-59: Low confidence

## Integration with Recommenders

The ExplainabilityEngine is designed to work seamlessly with existing recommenders:

```typescript
// In CropRecommender
const explanation = explainabilityEngine.generateCropExplanation(
  cropName,
  {
    suitability: suitabilityScore,
    profitability: profitabilityScore,
    risk: riskScore,
    overall: overallScore,
  },
  context
);

// Use structured explanation instead of simple string
recommendation.explanation = explanation;
```

## Testing

The ExplainabilityEngine has comprehensive unit tests covering:

- All recommendation types (crop, fertilizer, seed, soil, weather)
- Factor identification and impact analysis
- Confidence calculation
- Simple language requirements
- Edge cases (missing data, extreme values)

Run tests:
```bash
npm test -- ExplainabilityEngine.test.ts
```

## Future Enhancements

1. **Multi-language Support**: Generate explanations in regional languages
2. **Voice Output**: Convert explanations to voice format
3. **Visual Explanations**: Add charts and diagrams
4. **Personalization**: Adapt explanation style based on user literacy level
5. **Learning**: Improve explanations based on user feedback
