import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperatorRating, OperatorRatingDocument } from '../database/schemas/operator-rating.schema';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

@Injectable()
export class RatingsSeeder {
  constructor(
    @InjectModel(OperatorRating.name) private ratingModel: Model<OperatorRatingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed() {
    console.log('🌱 Seeding operator ratings...');

    // Проверяем, есть ли уже рейтинги
    const existingRatingsCount = await this.ratingModel.countDocuments();
    if (existingRatingsCount > 0) {
      console.log('🧹 Clearing existing ratings to recreate...');
      await this.ratingModel.deleteMany({});
    }

    // Получаем пользователей
    const visitors = await this.userModel.find({ role: UserRole.VISITOR }).limit(10);
    const operators = await this.userModel.find({ role: UserRole.OPERATOR });
    const admins = await this.userModel.find({ role: UserRole.ADMIN });

    if (visitors.length === 0 || operators.length === 0) {
      console.log('⚠️  No users found, skipping ratings seeding');
      return;
    }

    const positiveComments = [
      'Отличная работа! Быстро решил мою проблему.',
      'Очень вежливый и компетентный специалист.',
      'Помог разобраться с технической проблемой за 5 минут.',
      'Терпеливо объяснил все детали.',
      'Профессиональный подход к решению вопроса.',
      'Быстрый и качественный сервис.',
      'Оператор знает свое дело!',
      'Решил проблему, которую не могли решить другие.',
      'Очень доволен обслуживанием.',
      'Рекомендую этого специалиста!'
    ];

    const neutralComments = [
      'Вопрос решен, но пришлось долго ждать.',
      'В целом нормально, но могло быть быстрее.',
      'Проблема решена, спасибо.',
      'Обычное обслуживание.',
      'Вопрос закрыт, претензий нет.'
    ];

    const negativeComments = [
      'Очень долго ждал ответа.',
      'Оператор был не очень вежлив.',
      'Проблема решена не полностью.',
      'Пришлось объяснять несколько раз.',
      'Надеялся на более быстрое решение.'
    ];

    const ratings: any[] = [];
    const usedCombinations = new Set<string>();

    // Создаем рейтинги для каждого оператора
    for (const operator of operators) {
      // Генерируем 10-15 рейтингов для каждого оператора (меньше чтобы избежать коллизий)
      const ratingsCount = Math.floor(Math.random() * 6) + 10; // 10-15 рейтингов
      
      for (let i = 0; i < ratingsCount; i++) {
        // Выбираем уникальную комбинацию visitor + operator
        let visitor;
        let combinationKey;
        let attempts = 0;
        
        do {
          visitor = visitors[Math.floor(Math.random() * visitors.length)];
          combinationKey = `${visitor._id}-${operator._id}`;
          attempts++;
        } while (usedCombinations.has(combinationKey) && attempts < 20);
        
        // Если не удалось найти уникальную комбинацию, пропускаем
        if (usedCombinations.has(combinationKey)) {
          continue;
        }
        
        usedCombinations.add(combinationKey);
        
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5 звезд
        let comment = '';
        let isHidden = false;
        let hiddenBy: any = undefined;
        let hiddenAt: any = undefined;
        let hideReason: any = undefined;

        // Выбираем комментарий в зависимости от рейтинга
        if (rating >= 4) {
          comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
        } else if (rating === 3) {
          comment = neutralComments[Math.floor(Math.random() * neutralComments.length)];
        } else {
          comment = negativeComments[Math.floor(Math.random() * negativeComments.length)];
          
          // Иногда скрываем негативные отзывы (10% вероятность)
          if (Math.random() < 0.1) {
            isHidden = true;
            hiddenBy = admins[Math.floor(Math.random() * admins.length)]?._id;
            hiddenAt = new Date(Date.now() - Math.floor(Math.random() * 86400000)); // до 1 дня назад
            hideReason = 'Нецензурная лексика';
          }
        }

        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // в течение 30 дней

        ratings.push({
          operatorId: operator._id,
          visitorId: visitor._id,
          rating,
          comment,
          isHidden,
          hiddenBy,
          hiddenAt,
          hideReason,
          createdAt,
        });
      }
    }

    // Используем только сгенерированные рейтинги без специальных случаев
    const allRatings = ratings;

    try {
      let successCount = 0;
      for (const rating of allRatings) {
        try {
          await this.ratingModel.create(rating);
          successCount++;
        } catch (error) {
          // Пропускаем дубликаты
          if (error.code !== 11000) {
            console.warn('Warning inserting rating:', error.message);
          }
        }
      }
      console.log(`✅ Successfully created ${successCount} ratings`);
      
      // Статистика по операторам
      console.log('\n📋 Ratings by operator:');
      for (const operator of operators) {
        const operatorRatings = allRatings.filter(r => r.operatorId?.toString() === operator._id.toString());
        const visibleRatings = operatorRatings.filter(r => !r.isHidden);
        const avgRating = visibleRatings.length > 0 
          ? (visibleRatings.reduce((sum, r) => sum + r.rating, 0) / visibleRatings.length).toFixed(1)
          : '0.0';
        
        console.log(`  👤 ${operator.profile.fullName}: ${visibleRatings.length} отзывов, средний рейтинг: ${avgRating}⭐`);
      }
      
      console.log('\n📊 Overall statistics:');
      const visibleRatings = allRatings.filter(r => !r.isHidden);
      const hiddenRatings = allRatings.filter(r => r.isHidden);
      
      console.log(`  👁️  Visible ratings: ${visibleRatings.length}`);
      console.log(`  🙈 Hidden ratings: ${hiddenRatings.length}`);
      
      const ratingDistribution = {
        5: visibleRatings.filter(r => r.rating === 5).length,
        4: visibleRatings.filter(r => r.rating === 4).length,
        3: visibleRatings.filter(r => r.rating === 3).length,
        2: visibleRatings.filter(r => r.rating === 2).length,
        1: visibleRatings.filter(r => r.rating === 1).length,
      };
      
      console.log('  ⭐ Rating distribution:');
      Object.entries(ratingDistribution).reverse().forEach(([stars, count]) => {
        console.log(`    ${stars}⭐: ${count} отзывов`);
      });
      
      const overallAvg = visibleRatings.length > 0 
        ? (visibleRatings.reduce((sum, r) => sum + r.rating, 0) / visibleRatings.length).toFixed(2)
        : '0.00';
      console.log(`  📈 Overall average: ${overallAvg}⭐`);
      
    } catch (error) {
      console.error('❌ Error seeding ratings:', error);
      throw error;
    }
  }

  async clear() {
    console.log('🧹 Clearing ratings collection...');
    await this.ratingModel.deleteMany({});
    console.log('✅ Ratings collection cleared');
  }
}