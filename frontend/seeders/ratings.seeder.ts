import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperatorRating, OperatorRatingDocument } from '../schemas/operator-rating.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

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
      console.log('⭐ Ratings already exist, skipping ratings seeding');
      return;
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

    // Создаем рейтинги для каждого оператора
    for (const operator of operators) {
      // Генерируем 15-25 рейтингов для каждого оператора
      const ratingsCount = Math.floor(Math.random() * 11) + 15; // 15-25 рейтингов
      
      for (let i = 0; i < ratingsCount; i++) {
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
          userId: visitors[Math.floor(Math.random() * visitors.length)]._id,
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

    // Добавляем специальные тестовые случаи
    const specialRatings = [
      // Отличные рейтинги для Марии (operator1)
      {
        operatorId: operators[0]?._id,
        userId: visitors[0]?._id,
        rating: 5,
        comment: 'Мария потрясающая! Решила мою проблему за 2 минуты. Очень рекомендую!',
        isHidden: false,
        createdAt: new Date(Date.now() - 86400000), // 1 день назад
      },
      {
        operatorId: operators[0]?._id,
        userId: visitors[1]?._id,
        rating: 5,
        comment: 'Профессионал своего дела. Терпеливо объяснила все нюансы.',
        isHidden: false,
        createdAt: new Date(Date.now() - 172800000), // 2 дня назад
      },

      // Отличные рейтинги для Дениса (operator2)
      {
        operatorId: operators[1]?._id,
        userId: visitors[2]?._id,
        rating: 5,
        comment: 'Денис знает все о технических вопросах! Помог с интеграцией API.',
        isHidden: false,
        createdAt: new Date(Date.now() - 259200000), // 3 дня назад
      },

      // Средние рейтинги для Анны (operator3)
      {
        operatorId: operators[2]?._id,
        userId: visitors[3]?._id,
        rating: 3,
        comment: 'Анна помогла, но пришлось долго ждать ответа.',
        isHidden: false,
        createdAt: new Date(Date.now() - 345600000), // 4 дня назад
      },

      // Скрытый негативный отзыв
      {
        operatorId: operators[1]?._id,
        userId: visitors[4]?._id,
        rating: 1,
        comment: 'Этот отзыв содержал нецензурную лексику',
        isHidden: true,
        hiddenBy: admins[0]?._id,
        hiddenAt: new Date(Date.now() - 432000000),
        hideReason: 'Нецензурная лексика и оскорбления',
        createdAt: new Date(Date.now() - 518400000), // 6 дней назад
      },

      // Отзыв, скрытый по запросу оператора
      {
        operatorId: operators[2]?._id,
        userId: visitors[0]?._id,
        rating: 2,
        comment: 'Некомпетентный специалист',
        isHidden: true,
        hiddenBy: admins[1]?._id,
        hiddenAt: new Date(Date.now() - 604800000),
        hideReason: 'Содержит ложную информацию об операторе',
        createdAt: new Date(Date.now() - 691200000), // 8 дней назад
      },

      // Отзыв со спам-содержимым
      {
        operatorId: operators[3]?._id,
        userId: visitors[1]?._id,
        rating: 5,
        comment: 'ЛУЧШИЕ КРЕДИТЫ БЕЗ СПРАВОК! ЗВОНИТЕ 8-800-XXX-XXXX',
        isHidden: true,
        hiddenBy: admins[0]?._id,
        hiddenAt: new Date(Date.now() - 777600000),
        hideReason: 'Спам и реклама',
        createdAt: new Date(Date.now() - 864000000), // 10 дней назад
      },
    ];

    // Объединяем все рейтинги
    const allRatings = [...ratings, ...specialRatings];

    try {
      const createdRatings = await this.ratingModel.insertMany(allRatings);
      console.log(`✅ Successfully created ${createdRatings.length} ratings`);
      
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