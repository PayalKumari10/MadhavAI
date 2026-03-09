/**
 * ContentOrganization
 * Organizes lessons by topic with visual aids for low-literacy users
 */

import { Lesson, LessonCategory, LESSON_CATEGORIES } from '../../types/training.types';
import { ContentManager } from './ContentManager';

export interface CategoryInfo {
  id: LessonCategory;
  name: string;
  description: string;
  icon: string;
  lessonCount: number;
}

export class ContentOrganization {
  private contentManager: ContentManager;

  constructor(contentManager: ContentManager) {
    this.contentManager = contentManager;
  }

  /**
   * Get all available categories with metadata
   */
  async getCategories(language: string): Promise<CategoryInfo[]> {
    const categories: CategoryInfo[] = [];

    for (const category of LESSON_CATEGORIES) {
      const lessons = await this.contentManager.getLessons(category, language);
      categories.push({
        id: category,
        name: this.getCategoryName(category, language),
        description: this.getCategoryDescription(category, language),
        icon: this.getCategoryIcon(category),
        lessonCount: lessons.length,
      });
    }

    return categories.filter((c) => c.lessonCount > 0);
  }

  /**
   * Get lessons organized by difficulty level
   */
  async getLessonsByDifficulty(
    category: LessonCategory,
    language: string
  ): Promise<{
    beginner: Lesson[];
    intermediate: Lesson[];
    advanced: Lesson[];
  }> {
    const allLessons = await this.contentManager.getLessons(category, language);

    return {
      beginner: allLessons.filter((l) => l.difficulty === 'beginner'),
      intermediate: allLessons.filter((l) => l.difficulty === 'intermediate'),
      advanced: allLessons.filter((l) => l.difficulty === 'advanced'),
    };
  }

  /**
   * Get recommended learning path for a category
   */
  async getLearningPath(category: LessonCategory, language: string): Promise<Lesson[]> {
    const lessons = await this.contentManager.getLessons(category, language);

    // Sort by difficulty (beginner first) and then by title
    return lessons.sort((a, b) => {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      const diffA = difficultyOrder[a.difficulty];
      const diffB = difficultyOrder[b.difficulty];

      if (diffA !== diffB) {
        return diffA - diffB;
      }
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Get category name in specified language
   */
  private getCategoryName(category: LessonCategory, language: string): string {
    const names: { [key: string]: { [lang: string]: string } } = {
      pest_management: {
        en: 'Pest Management',
        hi: 'कीट प्रबंधन',
        ta: 'பூச்சி மேலாண்மை',
      },
      irrigation: {
        en: 'Irrigation',
        hi: 'सिंचाई',
        ta: 'நீர்ப்பாசனம்',
      },
      organic_farming: {
        en: 'Organic Farming',
        hi: 'जैविक खेती',
        ta: 'இயற்கை விவசாயம்',
      },
      soil_health: {
        en: 'Soil Health',
        hi: 'मिट्टी स्वास्थ्य',
        ta: 'மண் ஆரோக்கியம்',
      },
      crop_rotation: {
        en: 'Crop Rotation',
        hi: 'फसल चक्र',
        ta: 'பயிர் சுழற்சி',
      },
      fertilizer_management: {
        en: 'Fertilizer Management',
        hi: 'उर्वरक प्रबंधन',
        ta: 'உர மேலாண்மை',
      },
      seed_selection: {
        en: 'Seed Selection',
        hi: 'बीज चयन',
        ta: 'விதை தேர்வு',
      },
      weather_adaptation: {
        en: 'Weather Adaptation',
        hi: 'मौसम अनुकूलन',
        ta: 'வானிலை தழுவல்',
      },
      market_strategies: {
        en: 'Market Strategies',
        hi: 'बाजार रणनीतियाँ',
        ta: 'சந்தை உத்திகள்',
      },
      government_schemes: {
        en: 'Government Schemes',
        hi: 'सरकारी योजनाएं',
        ta: 'அரசு திட்டங்கள்',
      },
    };

    return names[category]?.[language] || names[category]?.en || category;
  }

  /**
   * Get category description in specified language
   */
  private getCategoryDescription(category: LessonCategory, language: string): string {
    const descriptions: { [key: string]: { [lang: string]: string } } = {
      pest_management: {
        en: 'Learn to identify and control pests naturally',
        hi: 'कीटों की पहचान और प्राकृतिक नियंत्रण सीखें',
      },
      irrigation: {
        en: 'Efficient water management techniques',
        hi: 'कुशल जल प्रबंधन तकनीकें',
      },
      organic_farming: {
        en: 'Sustainable farming without chemicals',
        hi: 'रसायनों के बिना टिकाऊ खेती',
      },
      soil_health: {
        en: 'Improve and maintain soil fertility',
        hi: 'मिट्टी की उर्वरता बढ़ाएं और बनाए रखें',
      },
      crop_rotation: {
        en: 'Rotate crops for better yields',
        hi: 'बेहतर उपज के लिए फसल चक्र',
      },
      fertilizer_management: {
        en: 'Use fertilizers effectively and safely',
        hi: 'उर्वरकों का प्रभावी और सुरक्षित उपयोग',
      },
      seed_selection: {
        en: 'Choose the right seeds for your farm',
        hi: 'अपने खेत के लिए सही बीज चुनें',
      },
      weather_adaptation: {
        en: 'Adapt farming to weather changes',
        hi: 'मौसम परिवर्तन के अनुसार खेती करें',
      },
      market_strategies: {
        en: 'Get better prices for your produce',
        hi: 'अपनी उपज के लिए बेहतर कीमत पाएं',
      },
      government_schemes: {
        en: 'Access government support and subsidies',
        hi: 'सरकारी सहायता और सब्सिडी प्राप्त करें',
      },
    };

    return (
      descriptions[category]?.[language] ||
      descriptions[category]?.en ||
      'Learn practical farming techniques'
    );
  }

  /**
   * Get icon name for category (for visual navigation)
   */
  private getCategoryIcon(category: LessonCategory): string {
    const icons: { [key: string]: string } = {
      pest_management: '🐛',
      irrigation: '💧',
      organic_farming: '🌱',
      soil_health: '🌍',
      crop_rotation: '🔄',
      fertilizer_management: '🧪',
      seed_selection: '🌾',
      weather_adaptation: '🌤️',
      market_strategies: '💰',
      government_schemes: '🏛️',
    };

    return icons[category] || '📚';
  }

  /**
   * Get lessons suitable for low-literacy users
   */
  async getLowLiteracyLessons(category: LessonCategory, language: string): Promise<Lesson[]> {
    const lessons = await this.contentManager.getLessons(category, language);

    // Filter for beginner level with visual aids
    return lessons.filter((lesson) => lesson.difficulty === 'beginner');
  }

  /**
   * Search lessons across all categories
   */
  async searchAllCategories(
    keyword: string,
    language: string
  ): Promise<{ [category: string]: Lesson[] }> {
    const results: { [category: string]: Lesson[] } = {};

    for (const category of LESSON_CATEGORIES) {
      const lessons = await this.contentManager.searchLessons(keyword, language);
      const categoryLessons = lessons.filter((l) => l.category === category);

      if (categoryLessons.length > 0) {
        results[category] = categoryLessons;
      }
    }

    return results;
  }
}
